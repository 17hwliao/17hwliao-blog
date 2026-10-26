'use client'

import { useState } from 'react'
import { PageIntro } from '@/components/page-intro'
import { ContentEmpty } from '@/components/content-empty'
import { ProjectRow } from './components/project-row'

import { ProjectCard, type Project } from './components/project-card'
import CreateDialog from './components/create-dialog'
import { pushProjects } from './services/push-projects'
import initialList from './list.json'
import type { ImageItem } from './components/image-upload-dialog'
import { useEditPage } from '@/hooks/use-edit-page'
import { EditToolbar, EditToolbarAddButton } from '@/components/edit-toolbar'

export default function Page() {
	const [projects, setProjects] = useState<Project[]>(initialList as Project[])
	const [originalProjects, setOriginalProjects] = useState<Project[]>(initialList as Project[])
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())

	const { isEditMode, setIsEditMode, enterEditMode, isSaving, hideEditButton, keyInputRef, buttonText, handleSaveClick, handlePemChange } = useEditPage()

	const handleUpdate = (updatedProject: Project, oldProject: Project, imageItem?: ImageItem) => {
		setProjects(prev => prev.map(p => (p.url === oldProject.url ? updatedProject : p)))
		if (imageItem) {
			setImageItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedProject.url, imageItem)
				return newMap
			})
		}
	}

	const handleAdd = () => {
		setEditingProject(null)
		setIsCreateDialogOpen(true)
	}

	const handleSaveProject = (updatedProject: Project) => {
		if (editingProject) {
			setProjects(projects.map(p => (p.url === editingProject.url ? updatedProject : p)))
		} else {
			setProjects([...projects, updatedProject])
		}
	}

	const handleDelete = (project: Project) => {
		if (confirm(`确定要删除 ${project.name} 吗？`)) {
			setProjects(projects.filter(p => p.url !== project.url))
		}
	}

	const persist = async () => {
		await pushProjects({ projects, imageItems })
		setOriginalProjects(projects)
		setImageItems(new Map())
	}

	const handleCancel = () => {
		setProjects(originalProjects)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={handlePemChange} />

			<PageIntro
				label='SELECTED WORK / OPEN SOURCE'
				title='想法，写成了代码。'
				description='从 Agent 与基础设施，到音乐和终端游戏。这里收集我正在做的开源项目。'
			/>
			<div className='collection-page'>
				{projects.length === 0 && <ContentEmpty title='想法，等待落地。' description='这里还没有项目。点击上方「编辑」，添加你的第一件作品。' />}
				<div className={isEditMode ? 'project-edit-grid' : 'project-directory'}>
					{projects.map((project, index) =>
						isEditMode ? (
							<ProjectCard key={project.url} project={project} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={() => handleDelete(project)} />
						) : (
							<ProjectRow key={project.url} project={project} index={index} />
						)
					)}
				</div>
			</div>

			<EditToolbar
				isEditMode={isEditMode}
				isSaving={isSaving}
				hideEditButton={hideEditButton}
				buttonText={buttonText}
				onEdit={enterEditMode}
				onCancel={handleCancel}
				onSave={() => handleSaveClick(persist)}
				extraEditActions={<EditToolbarAddButton onClick={handleAdd} />}
			/>

			{isCreateDialogOpen && <CreateDialog project={editingProject} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveProject} />}
		</>
	)
}
