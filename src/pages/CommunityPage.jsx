import { useState, useEffect } from 'react'
import { Plus, Search, Heart, MessageCircle, Flag, X, Camera, Send, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { compressImage } from '../lib/imageCompress'
const CATEGORIES = [
  { id: 'all',        label: 'All Posts',         emoji: '🌿' },
  { id: 'general',    label: 'General Gardening',  emoji: '🌱' },
  { id: 'vegetables', label: 'Vegetables',         emoji: '🍅' },
  { id: 'flowers',    label: 'Flowers',            emoji: '🌸' },
  { id: 'herbs',      label: 'Herbs',              emoji: '🌿' },
  { id: 'pests',      label: 'Pests & Disease',    emoji: '🐛' },
  { id: 'trade',      label: 'Sell & Trade',       emoji: '💰' },
  { id: 'weather',    label: 'Weather & Season',   emoji: '🌧️' },
  { id: 'questions',  label: 'Ask the Community',  emoji: '❓' },
]
const REPORT_REASONS = ['Inappropriate content', 'Spam or promotion', 'Harassment', 'Off topic', 'Other']
export default function CommunityPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [reportingPost, setReportingPost] = useState(null)
  const [expandedPost, setExpandedPost] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchPosts()
  }, [])
  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('community_posts')
      .select(`*, community_replies(*)`)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }
  const addPost = async (post) => {
    const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'Gardener'
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        display_name: displayName,
        category: post.category,
        title: post.title,
        text: post.text,
        location: post.location || null,
        photo_url: post.photo_url || null,
        likes: 0,
      })
      .select(`*, community_replies(*)`)
      .single()
    if (!error && data) setPosts(prev => [data, ...prev])
    setShowNewPost(false)
  }
  const toggleLike = async (postId) => {
    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()
    if (existing) {
      // Unlike
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      await supabase.from('community_posts').update({ likes: posts.find(p => p.id === postId)?.likes - 1 }).eq('id', postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1, _liked: false } : p))
    } else {
      // Like
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
      await supabase.from('community_posts').update({ likes: posts.find(p => p.id === postId)?.likes + 1 }).eq('id', postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1, _liked: true } : p))
    }
  }
  const addReply = async (postId, replyText, replyPhotoUrl) => {
    const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'Gardener'
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        post_id: postId,
        user_id: user.id,
        display_name: displayName,
        text: replyText,
        photo_url: replyPhotoUrl || null,
        likes: 0,
      })
      .select()
      .single()
    if (!error && data) {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, community_replies: [...(p.community_replies || []), data] }
          : p
      ))
    }
  }
  const filteredPosts = posts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
                        p.text?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })
  const formatTime = (isoStr) => {
    try {
      const d = new Date(isoStr)
      const now = new Date()
      const diff = Math.floor((now - d) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
      return `${Math.floor(diff/86400)}d ago`
    } catch { return '' }
  }
  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Community</h1>
          <p className="text-garden-500 text-sm mt-1">{posts.length} posts from fellow gardeners</p>
        </div>
        <button onClick={() => setShowGuidelines(true)} className="btn-primary text-sm flex-shrink-0">
          <Plus size={14} /> New Post
        </button>
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
        <input type="text" placeholder="Search posts..."
          value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 border transition-all ${
              activeCategory === cat.id ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">No posts yet</h3>
          <p className="text-garden-400 text-sm mb-5">Be the first to post!</p>
          <button onClick={() => setShowGuidelines(true)} className="btn-primary mx-auto text-sm">
            <Plus size={14} /> Create first post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post}
              isExpanded={expandedPost === post.id}
              onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onLike={() => toggleLike(post.id)}
              onReply={(text, photoUrl) => addReply(post.id, text, photoUrl)}
              onReport={() => setReportingPost(post)}
              formatTime={formatTime}
              categories={CATEGORIES}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
      {/* Guidelines modal */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-garden-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-display text-lg font-semibold text-garden-900">Community Guidelines</h3>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2">
              {['🌱 Keep it gardening related', '🤝 Be kind and respectful', '📸 Only share photos you own', '🚫 No spam or inappropriate content', '⚠️ Violations result in immediate removal'].map((rule, i) => (
                <p key={i} className="text-sm text-garden-700">{rule}</p>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={() => setShowGuidelines(false)} className="btn-secondary flex-1 justify-center py-2.5 text-sm">Cancel</button>
              <button onClick={() => { setShowGuidelines(false); setShowNewPost(true) }}
                className="btn-primary flex-1 justify-center py-2.5 text-sm">I Agree — Continue</button>
            </div>
          </div>
        </div>
      )}
      {showNewPost && (
        <NewPostModal categories={CATEGORIES.filter(c => c.id !== 'all')} onSave={addPost} onClose={() => setShowNewPost(false)} userId={user?.id} />
      )}
      {reportingPost && (
        <ReportModal post={reportingPost} onClose={() => setReportingPost(null)} />
      )}
    </div>
  )
}
function PostCard({ post, isExpanded, onToggleExpand, onLike, onReply, onReport, formatTime, categories, currentUserId }) {
  const [replyText, setReplyText] = useState('')
  const [replyPhoto, setReplyPhoto] = useState('')
  const [replyUploading, setReplyUploading] = useState(false)
  const [replyError, setReplyError] = useState('')
  const cat = categories.find(c => c.id === post.category)
  const replies = post.community_replies || []

  const handleReplyPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReplyError('')
    if (!file.type.startsWith('image/')) { setReplyError('Please choose an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setReplyError('Image must be under 10MB.'); return }
    setReplyUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `replies/${currentUserId}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('plant-photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('plant-photos').getPublicUrl(path)
      setReplyPhoto(publicUrl)
    } catch (err) {
      setReplyError(err.message || 'Upload failed.')
    } finally {
      setReplyUploading(false)
    }
  }

  const handleReply = () => {
    if (!replyText.trim() && !replyPhoto) return
    onReply(replyText.trim(), replyPhoto)
    setReplyText('')
    setReplyPhoto('')
  }
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-garden-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {post.display_name?.slice(0,2).toUpperCase() || 'GP'}
          </div>
          <div>
            <p className="text-sm font-medium text-garden-900">{post.display_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {post.location && <span className="text-xs text-garden-400">{post.location}</span>}
              <span className="text-xs text-garden-400">{formatTime(post.created_at)}</span>
              {cat && <span className="text-xs px-2 py-0.5 rounded-full bg-garden-100 text-garden-700">{cat.emoji} {cat.label}</span>}
            </div>
          </div>
        </div>
        <button onClick={onReport} className="text-garden-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Flag size={13} />
        </button>
      </div>
      <h3 className="font-display text-base font-semibold text-garden-900 mb-2">{post.title}</h3>
      <p className={`text-sm text-garden-700 leading-relaxed ${!isExpanded && post.text?.length > 200 ? 'line-clamp-3' : ''}`}>
        {post.text}
      </p>
      {post.text?.length > 200 && (
        <button onClick={onToggleExpand} className="text-xs text-garden-500 hover:text-garden-700 mt-1 font-medium">
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {post.photo_url && (
        <img src={post.photo_url} alt={post.title}
          className="mt-3 w-full rounded-xl border border-garden-100 object-cover max-h-96" />
      )}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-garden-50">
        <button onClick={onLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post._liked ? 'text-red-500' : 'text-garden-400 hover:text-red-400'}`}>
          <Heart size={15} className={post._liked ? 'fill-red-500' : ''} />
          {post.likes || 0}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-garden-400">
          <MessageCircle size={15} />
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>
      {replies.length > 0 && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-garden-100">
          {replies.map(reply => (
            <div key={reply.id} className="bg-garden-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-garden-500 flex items-center justify-center text-white text-[10px] font-medium">
                  {reply.display_name?.slice(0,2).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-garden-800">{reply.display_name}</span>
                <span className="text-[11px] text-garden-400">{formatTime(reply.created_at)}</span>
              </div>
              {reply.text && <p className="text-xs text-garden-700 leading-relaxed">{reply.text}</p>}
              {reply.photo_url && (
                <img src={reply.photo_url} alt="Reply" className="mt-2 rounded-lg border border-garden-100 max-h-56 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
      {replyPhoto && (
        <div className="mt-3 relative inline-block">
          <img src={replyPhoto} alt="Reply preview" className="rounded-lg border border-garden-100 max-h-40 object-cover" />
          <button onClick={() => setReplyPhoto('')}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white">
            <X size={12} />
          </button>
        </div>
      )}
      {replyError && <p className="text-xs text-red-600 mt-1.5">{replyError}</p>}
      <div className="mt-3 flex gap-2 items-center">
        <input className="input-field flex-1 text-sm" placeholder="Write a reply..."
          value={replyText} onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReply()} />
        <label className={`btn-secondary px-3 cursor-pointer flex-shrink-0 ${replyUploading ? 'opacity-60' : ''}`} title="Add photo">
          {replyUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          <input type="file" accept="image/*" className="hidden" onChange={handleReplyPhoto} disabled={replyUploading} />
        </label>
        <button onClick={handleReply} disabled={(!replyText.trim() && !replyPhoto) || replyUploading}
          className="btn-primary px-3 disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
function NewPostModal({ categories, onSave, onClose, userId }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')
  const [location, setLocation] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')

    // Basic guardrails
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10MB.')
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `community/${userId}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('plant-photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('plant-photos').getPublicUrl(path)
      setPhotoUrl(publicUrl)
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !text.trim()) return
    setSaving(true)
    await onSave({ title, text, category, location, photo_url: photoUrl })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-garden-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-garden-900">New post</h3>
            <button onClick={onClose}><X size={20} className="text-garden-400" /></button>
          </div>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    category === cat.id ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Title *</label>
            <input className="input-field" placeholder="What's on your mind?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Post *</label>
            <textarea className="input-field resize-none text-sm leading-relaxed" rows={5}
              placeholder="Share your experience, ask a question, or offer advice..."
              value={text} onChange={e => setText(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Location <span className="text-garden-400 font-normal">(optional)</span></label>
            <input className="input-field text-sm" placeholder="e.g. Nashville, TN" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Photo <span className="text-garden-400 font-normal">(optional)</span></label>
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="Upload preview" className="w-full rounded-xl border border-garden-100 object-cover max-h-64" />
                <button
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={`border-2 border-dashed border-garden-200 rounded-xl p-5 text-center block cursor-pointer transition-colors ${uploading ? 'opacity-60' : 'hover:border-garden-400'}`}>
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-garden-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-xs">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Camera size={20} className="text-garden-300 mx-auto mb-1" />
                    <p className="text-xs text-garden-500 font-medium">Tap to add a photo</p>
                    <p className="text-[11px] text-garden-400 mt-0.5">JPG or PNG, up to 5MB</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} disabled={uploading} />
              </label>
            )}
            {uploadError && <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-garden-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave}
            disabled={!title.trim() || !text.trim() || uploading || saving}
            className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-40">
            {saving ? 'Posting...' : 'Post to Community'}
          </button>
        </div>
      </div>
    </div>
  )
}
function ReportModal({ post, onClose }) {
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {submitted ? (
          <div className="px-5 py-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-display text-lg font-semibold text-garden-900 mb-2">Report submitted</h3>
            <p className="text-sm text-garden-500 mb-4">Thank you — we'll review this within 24 hours.</p>
            <button onClick={onClose} className="btn-primary mx-auto text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-garden-100 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-garden-900">Report post</h3>
              <button onClick={onClose}><X size={18} className="text-garden-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    reason === r ? 'border-red-400 bg-red-50 text-red-700' : 'border-garden-100 bg-white text-garden-700 hover:border-garden-300'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-sm">Cancel</button>
              <button onClick={() => reason && setSubmitted(true)} disabled={!reason}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
