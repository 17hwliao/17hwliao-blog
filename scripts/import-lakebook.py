"""Import Yuque lakebooks locally. Never executes note content or writes to GitHub."""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import sys
import tarfile
import threading
from datetime import datetime
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--book', action='append', type=Path, required=True)
parser.add_argument('--project-root', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--python-path', type=Path, help='Optional directory with migration-only dependencies')
parser.add_argument('--download-images', action='store_true')
args = parser.parse_args()
if args.python_path:
    sys.path.insert(0, str(args.python_path.resolve()))

import requests
import yaml
from bs4 import BeautifulSoup
from markdownify import MarkdownConverter

root = args.project_root.resolve()
blogs = root / 'public/blogs'
manifest_path = root / 'scripts/lakebook-import-manifest.json'
assets_path = root / 'scripts/lakebook-import-assets.json'


def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def encode_json(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def digest(value):
    return hashlib.sha256(value).hexdigest()


def write_bytes(path, content):
    if path.exists() and path.read_bytes() == content:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.lakebook-tmp')
    temporary.write_bytes(content)
    temporary.replace(path)


def write_json(path, value):
    write_bytes(path, encode_json(value))


def parse_date(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('Source timestamps must include a timezone')
    return parsed


def load_book(path):
    with tarfile.open(path, 'r:*') as archive:
        members = {m.name: m for m in archive.getmembers() if m.isfile()}
        meta_members = [m for m in members.values() if m.name.endswith('/$meta.json')]
        if len(meta_members) != 1:
            raise ValueError(f'{path.name}: expected one metadata file')
        meta_member = meta_members[0]
        meta = json.loads(json.load(archive.extractfile(meta_member))['meta'])
        prefix = meta_member.name.rsplit('/', 1)[0]
        toc = yaml.safe_load(meta['book']['tocYml'])
        nodes = {n['uuid']: n for n in toc if n.get('type') == 'DOC'}
        toc_by_id = {n['doc_id']: n for n in nodes.values()}
        records = []
        for item in meta['docs']:
            source_slug = item['slug']
            if not re.fullmatch(r'[a-zA-Z0-9_-]+', source_slug):
                raise ValueError('Unsafe source slug')
            doc = json.load(archive.extractfile(members[f'{prefix}/{source_slug}.json']))['doc']
            for key in ('id', 'title', 'created_at', 'updated_at', 'content_updated_at', 'published_at', 'first_published_at'):
                if doc.get(key) != item.get(key):
                    raise ValueError(f'{source_slug}: metadata mismatch for {key}')
            parse_date(doc['created_at'])
            node = toc_by_id.get(doc['id'])
            directory, visited = [], set()
            while node:
                if node['uuid'] in visited:
                    raise ValueError('Cycle in source directory')
                visited.add(node['uuid'])
                directory.insert(0, node['title'])
                node = nodes.get(node.get('parent_uuid'))
            records.append({'doc': doc, 'book': path.stem, 'bookId': item['book_id'], 'directory': directory or [doc['title']]})
        return records


records = [record for book in args.book for record in load_book(book)]
previous = read_json(manifest_path, {'documents': {}})
index = read_json(blogs / 'index.json', [])
if not isinstance(index, list):
    raise ValueError('Invalid existing article index')
slugs = set()
for record in records:
    doc = record['doc']
    slug = f'lake-{doc["id"]}'
    if slug in slugs:
        raise ValueError(f'Duplicate source document: {slug}')
    slugs.add(slug)
    record['slug'] = slug
    # Preflight every existing output before making any changes.
    old = previous['documents'].get(slug)
    existing_item = next((item for item in index if item['slug'] == slug), None)
    if old and old.get('indexSha256') and (existing_item is None or digest(encode_json(existing_item)) != old['indexSha256']):
        raise ValueError(f'Local changes in the index entry for {slug}; resolve before reimporting')
    for filename, hash_key in [('index.md', 'markdownSha256'), ('config.json', 'configSha256')]:
        target = blogs / slug / filename
        if target.exists() and (not old or digest(target.read_bytes()) != old.get(hash_key)):
            raise ValueError(f'Local changes in {slug}/{filename}; resolve before reimporting')
    if not old and any(item['slug'] == slug for item in index):
        raise ValueError(f'Existing index entry conflicts with {slug}')

assets = read_json(assets_path, {})
image_urls = set()
for record in records:
    soup = BeautifulSoup(record['doc'].get('body') or '', 'html.parser')
    record['soup'] = soup
    for image in soup.find_all('img'):
        url = image.get('src', '')
        if url.startswith('https://cdn.nlark.com/'):
            image_urls.add(url)

thread_context = threading.local()


def download_image(url):
    old = assets.get(url)
    if old and old.get('localPath'):
        existing = root / 'public' / old['localPath'].lstrip('/')
        if existing.is_file() and digest(existing.read_bytes()) == old.get('sha256'):
            return url, old
    if not getattr(thread_context, 'session', None):
        session = requests.Session()
        # Use a direct HTTPS connection; certificate verification remains enabled.
        session.trust_env = False
        thread_context.session = session
    try:
        response = thread_context.session.get(url, timeout=(8, 20))
        response.raise_for_status()
        mime = response.headers.get('Content-Type', '').split(';')[0].lower()
        extensions = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg'}
        if mime not in extensions or not response.content:
            raise ValueError('Response is not a supported image')
        if len(response.content) > 25 * 1024 * 1024:
            raise ValueError('Image exceeds 25 MB')
        local_path = f'/blogs/_assets/lakebook/{digest(url.encode())[:24]}.{extensions[mime]}'
        write_bytes(root / 'public' / local_path.lstrip('/'), response.content)
        return url, {'localPath': local_path, 'sha256': digest(response.content), 'bytes': len(response.content)}
    except (requests.RequestException, ValueError) as error:
        return url, {'error': type(error).__name__, 'message': str(error).split('\n')[0][:200]}


if args.download_images:
    print(f'Downloading/caching {len(image_urls)} images...', flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(download_image, url) for url in sorted(image_urls)]
        for count, future in enumerate(concurrent.futures.as_completed(futures), 1):
            url, result = future.result()
            assets[url] = result
            if count % 40 == 0 or count == len(futures):
                write_json(assets_path, dict(sorted(assets.items())))
                print(f'Images {count}/{len(futures)}; cached {sum(bool(a.get("localPath")) for a in assets.values())}', flush=True)


class LakeConverter(MarkdownConverter):

    def escape(self, text, parent_tags):
        # Literal Markdown pasted into rich text must not become new fences/headings.
        return re.sub(r'([\\`*_{}\[\]()#+\-.!|$~=])', r'\\\1', text)

    def process_text(self, el, parent_tags=None):
        text = super().process_text(el, parent_tags)
        if '_noformat' not in (parent_tags or set()):
            text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return text

    def convert_pre(self, el, text, parent_tags):
        # Read code as text, preserving its original whitespace and escape sequences.
        code = el.get_text()
        language = el.get('data-language', '')
        if not language:
            language = next((c.removeprefix('language-') for c in el.get('class', []) if c.startswith('language-')), '')
        language = 'text' if language == 'plain' else re.sub(r'[^a-zA-Z0-9_+-]', '', language)
        longest = max((len(run) for run in re.findall(r'`+', code)), default=0)
        fence = '`' * max(3, longest + 1)
        return f'\n\n{fence}{language}\n{code}\n{fence}\n\n'

    def convert_table(self, el, text, parent_tags):
        # Raw HTML retains merged cells and paragraphs that GFM tables cannot express.
        # Encode line breaks so Markdown cannot end an HTML table at a blank code line.
        html = str(el).replace('\r\n', '\n').replace('\r', '\n').replace('\n', '&#10;')
        return '\n\n' + html + '\n\n'

    def convert_img(self, el, text, parent_tags):
        src = el.get('src', '')
        if src.startswith('/') or src.startswith('https://'):
            alt = (el.get('alt') or '').replace('[', '\\[').replace(']', '\\]')
            return f'![{alt}](<{src}>)'
        return f' **[原笔记图片附件缺失：{src}]** '


converter = LakeConverter(heading_style='ATX', bullets='-', strip=['script', 'style'], escape_asterisks=True, escape_underscores=True)
next_manifest = dict(previous['documents'])
next_index = {item['slug']: item for item in index}
report_documents = []
for record in records:
    doc, soup, slug = record['doc'], record['soup'], record['slug']
    missing_images = []
    remote_images = []
    original_text = soup.get_text().strip()
    original_code_hashes = [digest(pre.get_text().replace('\r\n', '\n').replace('\r', '\n').rstrip('\n').encode()) for pre in soup.find_all('pre')]
    empty = not original_text and not soup.find('img')
    # Allow only passive article markup. Never import executable page attributes.
    for tag in list(soup.find_all(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'])):
        tag.decompose()
    for element in soup.find_all(True):
        for attribute in list(element.attrs):
            if attribute.lower().startswith('on') or attribute in ('style', 'srcdoc'):
                del element.attrs[attribute]
        for attribute in ('href', 'src'):
            value = element.get(attribute, '')
            if re.match(r'\s*(javascript|vbscript|data):', value, re.I):
                del element.attrs[attribute]
    for image in list(soup.find_all('img')):
        url = image.get('src', '')
        if url in assets and assets[url].get('localPath'):
            image['src'] = assets[url]['localPath']
        elif url.startswith('https://'):
            remote_images.append(url)
        else:
            missing_images.append(url)
            image.replace_with(soup.new_string(f' [原笔记图片附件缺失：{url}] '))
    markdown = converter.convert_soup(soup).strip() + '\n'
    if empty:
        markdown = '> 原笔记中没有正文内容，已保留标题、目录位置和原始时间。\n'
    if not empty and not markdown.strip():
        raise ValueError(f'{slug}: conversion unexpectedly produced empty content')
    summary = re.sub(r'\s+', ' ', doc.get('custom_description') or doc.get('description') or original_text).strip()[:150]
    tags = [record['book']]
    if len(record['directory']) > 1 and record['directory'][0] not in tags:
        tags.append(record['directory'][0])
    source = {
        'type': 'yuque-lakebook', 'book': record['book'], 'bookId': record['bookId'],
        'docId': doc['id'], 'slug': doc['slug'], 'directory': record['directory'],
        'status': doc.get('status'), 'empty': empty,
        'bodySha256': digest((doc.get('body') or '').encode()),
        'missingImageReferences': missing_images,
    }
    config = {
        'title': doc['title'], 'tags': tags, 'date': doc['created_at'],
        'createdAt': doc['created_at'], 'updatedAt': doc.get('updated_at'),
        'contentUpdatedAt': doc.get('content_updated_at'),
        'firstPublishedAt': doc.get('first_published_at'), 'publishedAt': doc.get('published_at'),
        'summary': summary if not empty else '原笔记为空白文档，保留原始目录与时间。',
        'category': record['book'], 'source': source,
    }
    md_bytes, config_bytes = markdown.encode('utf-8'), encode_json(config)
    write_bytes(blogs / slug / 'index.md', md_bytes)
    write_bytes(blogs / slug / 'config.json', config_bytes)
    next_manifest[slug] = {
        'book': record['book'], 'docId': doc['id'], 'title': doc['title'],
        'markdownSha256': digest(md_bytes), 'configSha256': digest(config_bytes),
        'sourceCodeSha256': original_code_hashes,
    }
    next_index[slug] = {'slug': slug, **{k: config[k] for k in ('title', 'tags', 'date', 'summary', 'category', 'createdAt', 'updatedAt', 'contentUpdatedAt', 'firstPublishedAt', 'publishedAt')}}
    next_manifest[slug]['indexSha256'] = digest(encode_json(next_index[slug]))
    report_documents.append({'slug': slug, 'title': doc['title'], 'book': record['book'], 'date': config['date'], 'empty': empty, 'missingImages': missing_images, 'externalImages': remote_images})

sorted_index = sorted(next_index.values(), key=lambda entry: (parse_date(entry['date']), entry['slug']), reverse=True)
categories = read_json(blogs / 'categories.json', {'categories': []})
categories['categories'] = list(dict.fromkeys(categories['categories'] + [r['book'] for r in records]))
write_json(blogs / 'categories.json', categories)
write_json(blogs / 'index.json', sorted_index)
write_json(manifest_path, {'version': 1, 'dateField': 'created_at', 'documents': next_manifest})
report = {
    'documents': len(records), 'nonempty': sum(not d['empty'] for d in report_documents),
    'empty': sum(d['empty'] for d in report_documents),
    'missingImageReferences': sum(len(d['missingImages']) for d in report_documents),
    'cachedImages': sum(bool(assets.get(url, {}).get('localPath')) for url in image_urls),
    'externalImageReferences': sum(len(d['externalImages']) for d in report_documents),
    'newest': {'title': sorted_index[0]['title'], 'date': sorted_index[0]['date'], 'slug': sorted_index[0]['slug']},
    'oldest': {'title': sorted_index[-1]['title'], 'date': sorted_index[-1]['date'], 'slug': sorted_index[-1]['slug']},
    'details': sorted(report_documents, key=lambda d: (parse_date(d['date']), d['slug']), reverse=True),
}
write_json(root / 'scripts/lakebook-import-report.json', report)
print(json.dumps({k: v for k, v in report.items() if k != 'details'}, ensure_ascii=False, indent=2), flush=True)
