import { useEffect, useState } from 'react'
import { Trash2, Eye, Play, Image as ImageIcon } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Avatar, Button, Card, ListSkeleton, Badge, Modal } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { getErrorMessage } from '@/api/axios'
import { formatDate } from '@/utils/format'
import type { StoryModeration } from '@/types'

export function AdminStoriesPage() {
  const [stories, setStories] = useState<StoryModeration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewStory, setPreviewStory] = useState<StoryModeration | null>(null)
  const { showToast } = useToast()

  const load = () => {
    setIsLoading(true)
    adminApi.getPendingStories()
      .then(setStories)
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteStory(id)
      showToast('Story deleted successfully', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleteId(null)
    }
  }

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|mov|webm|mkv)$/i)
  }

  const getMediaType = (url: string) => {
    return isVideo(url) ? 'video' : 'image'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Story Moderation</h1>
      
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : stories.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No pending stories</p>
          <p className="text-sm mt-1">All stories have been moderated</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => {
            const mediaType = getMediaType(story.mediaUrl)
            const fullUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5008'}${story.mediaUrl}`
            
            return (
              <Card key={story.id} className="p-4">
                <div className="flex flex-wrap gap-4">
                  {/* Media Preview */}
                  <div
                    className="w-32 h-32 bg-slate-100 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                    onClick={() => setPreviewStory(story)}
                  >
                    {mediaType === 'video' ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    ) : (
                      <img
                        src={fullUrl}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{story.guideName}</span>
                          <Badge variant={mediaType === 'video' ? 'warning' : 'primary'}>
                            {mediaType === 'video' ? 'Video' : 'Image'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(story.createdAt)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteId(story.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                    
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                      {story.caption || 'No caption'}
                    </p>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setPreviewStory(story)}
                    >
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewStory}
        onClose={() => setPreviewStory(null)}
        title="Story Preview"
        size="lg"
      >
        {previewStory && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={previewStory.guideName} size="md" />
              <div>
                <p className="font-semibold">{previewStory.guideName}</p>
                <p className="text-xs text-slate-400">{formatDate(previewStory.createdAt)}</p>
              </div>
            </div>
            
            <div className="bg-slate-100 rounded-lg overflow-hidden max-h-[400px] flex items-center justify-center">
              {getMediaType(previewStory.mediaUrl) === 'video' ? (
                <video
                  src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5008'}${previewStory.mediaUrl}`}
                  controls
                  className="max-w-full max-h-[400px]"
                  autoPlay
                />
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5008'}${previewStory.mediaUrl}`}
                  alt="Story"
                  className="max-w-full max-h-[400px] object-contain"
                />
              )}
            </div>
            
            <p className="mt-4 text-slate-600">{previewStory.caption || 'No caption'}</p>
            
            <div className="mt-4 flex justify-end">
              <Button variant="danger" onClick={() => {
                setDeleteId(previewStory.id)
                setPreviewStory(null)
              }}>
                <Trash2 className="h-4 w-4" /> Delete Story              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Story"
      >
        <p className="text-slate-600 mb-4">
          Are you sure you want to delete this story? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}