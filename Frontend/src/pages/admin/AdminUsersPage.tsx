import { useEffect, useState } from 'react'
import { Ban, CheckCircle, Trash2, Search } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Avatar, Badge, Button, Card, ListSkeleton, Input, Modal } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { getErrorMessage } from '@/api/axios'
import { formatDate } from '@/utils/format'
import type { UserManagement } from '@/types'

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserManagement[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserManagement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [actionUser, setActionUser] = useState<{ id: string; name: string; action: 'ban' | 'unban' | 'delete' } | null>(null)
  const { showToast } = useToast()

  const load = () => {
    setIsLoading(true)
    adminApi.getUsers()
      .then((data) => {
        setUsers(data)
        setFilteredUsers(data)
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let filtered = [...users]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        u => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      )
    }
    
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    
    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, users])

  const handleToggleBan = async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId)
      showToast('User status updated successfully', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionUser(null)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId)
      showToast('User deleted successfully', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionUser(null)
    }
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    Tourist: { label: 'Tourist', color: 'bg-cyan-100 text-cyan-700' },
    Guide: { label: 'Guide', color: 'bg-emerald-100 text-emerald-700' },
    Admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  }

  const getActionModalContent = () => {
    if (!actionUser) return { title: '', message: '', confirmText: '', confirmVariant: 'danger' as const }
    switch (actionUser.action) {
      case 'ban':
        return {
          title: 'Ban User',
          message: `Are you sure you want to ban ${actionUser.name}? They will not be able to access the platform.`,
          confirmText: 'Ban User',
          confirmVariant: 'danger' as const,
        }
      case 'unban':
        return {
          title: 'Unban User',
          message: `Are you sure you want to unban ${actionUser.name}? They will regain access to the platform.`,
          confirmText: 'Unban User',
          confirmVariant: 'primary' as const,
        }
      case 'delete':
        return {
          title: 'Delete User',
          message: `Are you sure you want to permanently delete ${actionUser.name}? This action cannot be undone.`,
          confirmText: 'Delete User',
          confirmVariant: 'danger' as const,
        }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Tourist">Tourists</option>
          <option value="Guide">Guides</option>
          <option value="Admin">Admins</option>
        </select>
      </div>
      
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No users found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const role = roleLabels[user.role] || { label: user.role, color: 'bg-slate-100 text-slate-700' }
            return (
              <Card key={user.id} className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar
                    src={user.profilePicture}
                    name={user.fullName}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{user.fullName}</p>
                      <Badge className={role.color}>{role.label}</Badge>
                      <Badge variant={user.blocked ? 'danger' : 'success'}>
                        {user.blocked ? 'Banned' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">Joined: {user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.role !== 'Admin' && (
                      <>
                        {user.blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => setActionUser({ id: user.id, name: user.fullName, action: 'unban' })}
                          >
                            <CheckCircle className="h-4 w-4" /> Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-600 hover:bg-amber-50"
                            onClick={() => setActionUser({ id: user.id, name: user.fullName, action: 'ban' })}
                          >
                            <Ban className="h-4 w-4" /> Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setActionUser({ id: user.id, name: user.fullName, action: 'delete' })}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!actionUser}
        onClose={() => setActionUser(null)}
        title={getActionModalContent().title}
      >
        <p className="text-slate-600 mb-4">{getActionModalContent().message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setActionUser(null)}>
            Cancel
          </Button>
          <Button
            variant={getActionModalContent().confirmVariant}
            onClick={() => {
              if (!actionUser) return
              if (actionUser.action === 'delete') handleDelete(actionUser.id)
              else handleToggleBan(actionUser.id)
            }}
          >
            {getActionModalContent().confirmText}
          </Button>
        </div>
      </Modal>
    </div>
  )
}