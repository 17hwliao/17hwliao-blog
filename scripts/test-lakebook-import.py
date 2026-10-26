"""Small migration fixtures: timestamps, exact code, tables, reruns and conflicts."""
import io
import json
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest

IMPORTER = Path(__file__).with_name('import-lakebook.py').resolve()


class ImportTests(unittest.TestCase):
    def test_local_migration(self):
        with tempfile.TemporaryDirectory(prefix='lakebook-import-test-') as temporary:
            root = Path(temporary)
            source = root / 'Test.lakebook'
            original_code = 'const example = "<script>alert(1)</script>";\n// ``` nested fence\n'
            docs = [
                {'id': 1, 'slug': 'old', 'title': 'Old note', 'created_at': '2025-12-31T23:30:00.000Z', 'body': '<h2>Heading</h2><pre data-language="javascript"><code>' + original_code.replace('<', '&lt;').replace('>', '&gt;') + '</code></pre><table><tbody><tr><td colspan="2">merged<pre><code>line1\n\n## comment\nline2</code></pre></td></tr></tbody></table><p>&lt;script&gt;literal text&lt;/script&gt;</p><p>```json</p><p>literal fence</p><p>```</p>'},
                {'id': 2, 'slug': 'new', 'title': 'New empty note', 'created_at': '2026-01-01T08:00:00+08:00', 'body': ''},
            ]
            for doc in docs:
                doc.update({'updated_at': '2026-02-02T00:00:00Z', 'content_updated_at': '2026-02-01T00:00:00Z', 'published_at': None, 'first_published_at': None, 'book_id': 42})
            toc = '\n'.join(f'- type: DOC\n  uuid: node{doc["id"]}\n  doc_id: {doc["id"]}\n  title: {doc["title"]}\n  parent_uuid: ""' for doc in docs)
            metadata = {'docs': docs, 'book': {'tocYml': toc}}
            with tarfile.open(source, 'w') as archive:
                entries = {'book/$meta.json': {'meta': json.dumps(metadata)}}
                entries.update({f'book/{doc["slug"]}.json': {'doc': doc} for doc in docs})
                for name, value in entries.items():
                    raw = json.dumps(value).encode()
                    entry = tarfile.TarInfo(name)
                    entry.size = len(raw)
                    archive.addfile(entry, io.BytesIO(raw))
            command = [sys.executable, str(IMPORTER), '--project-root', str(root), '--book', str(source)]
            first = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
            self.assertEqual(first.returncode, 0, first.stderr)
            index = json.loads((root / 'public/blogs/index.json').read_text(encoding='utf-8'))
            self.assertEqual([item['title'] for item in index], ['New empty note', 'Old note'])
            config = json.loads((root / 'public/blogs/lake-1/config.json').read_text(encoding='utf-8'))
            self.assertEqual(config['date'], docs[0]['created_at'])
            self.assertEqual(config['publishedAt'], None)
            markdown = (root / 'public/blogs/lake-1/index.md').read_text(encoding='utf-8')
            self.assertIn(original_code, markdown)
            self.assertIn('````javascript', markdown)
            self.assertIn('colspan="2"', markdown)
            self.assertIn('line1&#10;&#10;## comment&#10;line2', markdown)
            self.assertIn('&lt;script&gt;literal text&lt;/script&gt;', markdown)
            self.assertIn(r'\`\`\`json', markdown)
            generated = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
            second = subprocess.run(command, capture_output=True)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(generated, {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()})
            article = root / 'public/blogs/lake-1/index.md'
            article.write_text('Local edits that must survive', encoding='utf-8')
            before_conflict = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
            conflict = subprocess.run(command, capture_output=True)
            self.assertNotEqual(conflict.returncode, 0)
            self.assertEqual(before_conflict, {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()})


if __name__ == '__main__':
    unittest.main()
