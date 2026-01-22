
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { votesApi, disputesApi, projectsApi, commentsApi } from '../services/api'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [projects, setProjects] = useState([])
  const [newPost, setNewPost] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState({})
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingPost, setEditingPost] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })

  useEffect(() => {
    loadFeed()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      setProjects(data || [])
    } catch (e) { console.error(e) }
  }

  const loadFeed = async () => {
    setLoading(true)
    try {
      const [votesRes, disputesRes] = await Promise.all([
        votesApi.list().catch(() => ({ data: [] })),
        disputesApi.list().catch(() => ({ data: [] }))
      ])

      const votesWithDetails = await Promise.all(
        (votesRes.data || []).map(async v => {
          try {
            const { data: detail } = await votesApi.get(v.id)
            return { ...v, options: detail.options || [] }
          } catch {
            return { ...v, options: [] }
          }
        })
      )
      const votesPosts = votesWithDetails.map(v => {
        const agreeOption = v.options?.[0]
        const disagreeOption = v.options?.[1]
        return {
          id: `vote-${v.id}`,
          realId: v.id,
          type: 'proposal',
          title: v.title,
          description: v.description,
          project: v.project_name || 'general',
          project_id: v.project_id,
          upvotes: agreeOption?.vote_count || 0,
          downvotes: disagreeOption?.vote_count || 0,
          options: v.options,
          comments: 0,
          status: v.status,
          created_at: v.created_at,
          is_staff_decided: v.status === 'staff_decided',
          user_login: v.user_login,
          original: v
        }
      })

      const disputesPosts = (disputesRes.data || []).map(d => ({
        id: `dispute-${d.id}`,
        realId: d.id,
        type: 'dispute',
        title: d.title,
        description: d.description,
        project: d.project_name || 'general',
        project_id: d.project_id,
        upvotes: d.corrector_votes || 0,
        downvotes: d.corrected_votes || 0,
        comments: 0,
        status: d.status,
        created_at: d.created_at,
        user_login: d.created_by_login,
        original: d
      }))

      const allPosts = [...votesPosts, ...disputesPosts].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )

      setPosts(allPosts)

    
      const voteIds = votesPosts.map(p => p.realId)
      const disputeIds = disputesPosts.map(p => p.realId)
      if (voteIds.length || disputeIds.length) {
        try {
          const { data } = await commentsApi.getCounts(voteIds, disputeIds)
          setCommentCounts(data || {})
        } catch (e) { console.error(e) }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleBroadcast = async () => {
    if (!newPost.trim() || !selectedTag) return alert('Add content and select a project tag')
    
    try {
      await votesApi.create({
        title: newPost.substring(0, 100),
        description: newPost,
        project_id: parseInt(selectedTag),
        options: ['Agree', 'Disagree']
      })
      setNewPost('')
      setSelectedTag('')
      loadFeed()
    } catch (e) { 
      console.error(e)
      alert('Failed to post. Try again.')
    }
  }

  const handleUpvote = async (post) => {
    try {
      if (post.type === 'proposal') {
    
        if (post.options?.length > 0) {
          await votesApi.cast(post.realId, post.options[0].id)
        }
      } else {

        await disputesApi.vote(post.realId, 'corrector')
      }
      loadFeed()
    } catch (e) { 
      console.error(e)
      alert(e.response?.data?.detail || 'Already voted or error')
    }
  }

  const handleDownvote = async (post) => {
    try {
      if (post.type === 'proposal') {

        if (post.options?.length > 1) {
          await votesApi.cast(post.realId, post.options[1].id)
        }
      } else {
    
        await disputesApi.vote(post.realId, 'corrected')
      }
      loadFeed()
    } catch (e) { 
      console.error(e)
      alert(e.response?.data?.detail || 'Already voted or error')
    }
  }

  const toggleComments = async (post) => {
    if (expandedPost === post.id) {
      setExpandedPost(null)
      setComments([])
      return
    }
    setExpandedPost(post.id)
    try {
      const params = post.type === 'proposal' 
        ? { vote_id: post.realId } 
        : { dispute_id: post.realId }
      const { data } = await commentsApi.list(
        post.type === 'proposal' ? post.realId : null,
        post.type === 'dispute' ? post.realId : null
      )
      setComments(data || [])
    } catch (e) { console.error(e) }
  }

  const handleAddComment = async (post) => {
    if (!newComment.trim()) return
    try {
      await commentsApi.create({
        content: newComment,
        vote_id: post.type === 'proposal' ? post.realId : null,
        dispute_id: post.type === 'dispute' ? post.realId : null
      })
      setNewComment('')
      toggleComments(post)
      setExpandedPost(post.id)

      const key = post.type === 'proposal' ? `vote-${post.realId}` : `dispute-${post.realId}`
      setCommentCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    } catch (e) { console.error(e) }
  }

  const handleDeleteComment = async (commentId, post) => {
    try {
      await commentsApi.delete(commentId)
      toggleComments(post)
      setExpandedPost(post.id)
    } catch (e) { console.error(e) }
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setEditForm({ title: post.title, description: post.description })
  }

  const handleSaveEdit = async (post) => {
    try {
      if (post.type === 'proposal') {
        await votesApi.update(post.realId, editForm)
      } else {
        await disputesApi.update(post.realId, editForm)
      }
      setEditingPost(null)
      setEditForm({ title: '', description: '' })
      loadFeed()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDeletePost = async (post) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      if (post.type === 'proposal') {
        await votesApi.delete(post.realId)
      } else {
        await disputesApi.delete(post.realId)
      }
      loadFeed()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  const getCommentCount = (post) => {
    const key = post.type === 'proposal' ? `vote-${post.realId}` : `dispute-${post.realId}`
    return commentCounts[key] || 0
  }

  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = searchQuery.trim()
    ? posts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts

  return (
    <div className="p-6">

      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Search posts, projects, discussions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#00d4aa] placeholder-gray-500"
          />
        </div>
      </div>

    
      <div className="bg-[#161b22] rounded-lg p-4 mb-6 border border-gray-800">
        <textarea
          placeholder="Stuck on a logic gate? Ask the hive..."
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#00d4aa] placeholder-gray-500"
          rows={3}
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="bg-[#0d1117] border border-gray-700 rounded px-3 py-1.5 text-sm text-[#00d4aa] focus:outline-none w-full sm:w-auto"
          >
            <option value="">Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>#{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleBroadcast}
            className="bg-[#00d4aa] text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors w-full sm:w-auto"
          >
            Broadcast Post
          </button>
        </div>
      </div>

    
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-yellow-400 mb-4">
          <span>⚡</span> Active Proposals
        </h2>
      </div>

    
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading feed...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? 'No posts match your search.' : 'No posts yet. Be the first to start a discussion!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-[#161b22] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
            
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#0d1117] text-[#00d4aa] px-2 py-0.5 rounded border border-gray-700">
                    #{post.project}
                  </span>
                  {post.is_staff_decided && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                      ✓ STAFF VALIDATED
                    </span>
                  )}
                  {post.type === 'proposal' && post.status === 'open' && (
                    <span className="text-xs text-yellow-400">🔥 Hot</span>
                  )}
                  {post.user_login && (
                    <span className="text-xs text-gray-500">by @{post.user_login}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {post.original?.user_id === user?.id && post.status === 'open' && (
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-gray-500 hover:text-[#00d4aa] text-xs px-2 py-1 rounded hover:bg-[#00d4aa]/10 transition-colors"
                      title="Edit post"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {user?.is_staff && (
                    <button
                      onClick={() => handleDeletePost(post)}
                      className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                      title="Delete post (Staff only)"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>

            
              {editingPost === post.id ? (
                <div className="mb-4 p-3 bg-[#0d1117] rounded-lg border border-[#00d4aa]/50">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 mb-2 text-sm focus:outline-none focus:border-[#00d4aa]"
                    placeholder="Title"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 mb-2 text-sm focus:outline-none focus:border-[#00d4aa] resize-none"
                    rows={3}
                    placeholder="Description"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(post)}
                      className="bg-[#00d4aa] text-black px-3 py-1 rounded text-sm font-medium hover:bg-[#00b894]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                 
                  <h3 className="font-semibold mb-2">
                    {post.type === 'proposal' ? 'Proposal: ' : ''}{post.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.description}</p>
                </>
              )}

        
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleUpvote(post)}
                    className="flex items-center gap-1 text-gray-400 hover:text-[#00d4aa] transition-colors bg-[#0d1117] px-3 py-1 rounded border border-gray-700"
                  >
                    <span>↑</span> {post.upvotes}
                  </button>
                  <button 
                    onClick={() => handleDownvote(post)}
                    className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors bg-[#0d1117] px-3 py-1 rounded border border-gray-700"
                  >
                    <span>↓</span> {post.downvotes}
                  </button>
                </div>
                <button 
                  onClick={() => toggleComments(post)}
                  className="text-gray-500 flex items-center gap-1 hover:text-[#00d4aa] transition-colors"
                >
                  💬 {getCommentCount(post)} comments
                </button>
                <span className="text-gray-600 text-xs ml-auto">
                  {getTimeAgo(post.created_at)}
                </span>
              </div>

        
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
            
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00d4aa] placeholder-gray-500"
                      onKeyPress={e => e.key === 'Enter' && handleAddComment(post)}
                    />
                    <button
                      onClick={() => handleAddComment(post)}
                      disabled={!newComment.trim()}
                      className="bg-[#00d4aa] text-black px-4 py-2 rounded text-sm font-medium hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>

                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-2">No comments yet. Be the first!</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-[#0d1117] rounded-lg border border-gray-800">
                          <img
                            src={comment.avatar_url || `https://ui-avatars.com/api/?name=${comment.user_login || 'User'}&background=00d4aa&color=000`}
                            alt={comment.user_login}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[#00d4aa]">{comment.user_login || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                          </div>
                          {user && (user.id === comment.user_id || user.is_staff) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id, post)}
                              className="text-gray-500 hover:text-red-400 text-xs"
                              title="Delete comment"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}