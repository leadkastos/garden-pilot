import { useState, useEffect } from 'react'
import { Plus, Search, Heart, MessageCircle, Flag, X, Camera, ChevronDown, ChevronUp, AlertTriangle, Send } from 'lucide-react'

const CATEGORIES = [
  { id: 'all',       label: 'All Posts',        emoji: '🌿' },
  { id: 'general',   label: 'General Gardening', emoji: '🌱' },
  { id: 'vegetables',label: 'Vegetables',        emoji: '🍅' },
  { id: 'flowers',   label: 'Flowers',           emoji: '🌸' },
  { id: 'herbs',     label: 'Herbs',             emoji: '🌿' },
  { id: 'pests',     label: 'Pests & Disease',   emoji: '🐛' },
  { id: 'trade',     label: 'Sell & Trade',      emoji: '💰' },
  { id: 'weather',   label: 'Weather & Season',  emoji: '🌧️' },
  { id: 'questions', label: 'Ask the Community', emoji: '❓' },
]

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or promotion',
  'Harassment',
  'Off topic',
  'Other'
]

// Sample community posts to seed the page
const SEED_POSTS = [
  {
    id: 1,
    displayName: 'GardenGuru_Sarah',
    category: 'vegetables',
    title: 'First tomatoes of the season! 🍅',
    text: 'Just harvested my first Roma tomatoes today. Started them from seed back in March and they finally came in. So proud of how they turned out this year! The key for me was adding a layer of compost in early May.',
    photo: null,
    likes: 24,
    likedBy: [],
    replies: [
      { id: 101, displayName: 'TomGardener', text: 'Congrats! What variety did you go with?', createdAt: '2026-06-10T14:30:00', likes: 3, likedBy: [] },
      { id: 102, displayName: 'GardenGuru_Sarah', text: 'Roma VF from Johnny\'s Seeds — incredible germination rate!', createdAt: '2026-06-10T15:00:00', likes: 5, likedBy: [] },
    ],
    createdAt: '2026-06-10T12:00:00',
    location: 'Franklin, TN',
  },
  {
    id: 2,
    displayName: 'ZinniaQueen',
    category: 'flowers',
    title: 'My zinnia bed is absolutely exploding this year',
    text: 'Three weeks ago I was worried they weren\'t going to come in. Today I have over 200 blooms ready to cut. Oklahoma Salmon and Benary Mix are my top performers. Anyone else having a great zinnia season?',
    photo: null,
    likes: 41,
    likedBy: [],
    replies: [
      { id: 201, displayName: 'CutFlowerFarm', text: 'Oklahoma Salmon is my absolute favorite! What spacing are you using?', createdAt: '2026-06-11T09:00:00', likes: 2, likedBy: [] },
    ],
    createdAt: '2026-06-11T08:00:00',
    location: 'Nashville, TN',
  },
  {
    id: 3,
    displayName: 'HerbLover_Mike',
    category: 'questions',
    title: 'Why are my basil leaves turning yellow?',
    text: 'I planted Genovese basil about 6 weeks ago and the lower leaves keep turning yellow and dropping off. I\'m watering every other day. Is this overwatering? Nutrient deficiency? Any advice would be appreciated.',
    photo: null,
    likes: 8,
    likedBy: [],
    replies: [
      { id: 301, displayName: 'GardenGuru_Sarah', text: 'Almost certainly overwatering! Basil likes to dry out a bit between waterings. Try every 3-4 days and see if that helps.', createdAt: '2026-06-11T11:00:00', likes: 7, likedBy: [] },
      { id: 302, displayName: 'HerbSpecialist', text: 'Also check if the pot has drainage holes. Basil hates sitting in water.', createdAt: '2026-06-11T12:00:00', likes: 4, likedBy: [] },
    ],
    createdAt: '2026-06-11T10:00:00',
    location: 'Brentwood, TN',
  },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [reportingPost, setReportingPost] = useState(null)
  const [expandedPost, setExpandedPost] = useState(null)

  // Load posts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_community')
      if (saved) {
        setPosts(JSON.parse(saved))
      } else {
        // Seed with sample posts
        setPosts(SEED_POSTS)
        localStorage.setItem('gardenpilot_community', JSON.stringify(SEED_POSTS))
      }
    } catch (e) { console.error('Error loading community:', e) }
  }, [])

  const savePosts = (newPosts) => {
    setPosts(newPosts)
    localStorage.setItem('gardenpilot_community', JSON.stringify(newPosts))
  }

  const addPost = (post) => {
    const newPost = {
      ...post,
      id: Date.now(),
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: new Date().toISOString(),
    }
    savePosts([newPost, ...posts])
    setShowNewPost(false)
  }

  const toggleLike = (postId) => {
    savePosts(posts.map(p => {
      if (p.id !== postId) return p
      const liked = p.likedBy.includes('me')
      return {
        ...p,
        likes: liked ? p.likes - 1 : p.likes + 1,
        likedBy: liked ? p.likedBy.filter(x => x !== 'me') : [...p.likedBy, 'me']
      }
    }))
  }

  const toggleReplyLike = (postId, replyId) => {
    savePosts(posts.map(p => {
      if (p.id !== postId) return p
      return {
        ...p,
        replies: p.replies.map(r => {
          if (r.id !== replyId) return r
          const liked = r.likedBy.includes('me')
          return {
            ...r,
            likes: liked ? r.likes - 1 : r.likes + 1,
            likedBy: liked ? r.likedBy.filter(x => x !== 'me') : [...r.likedBy, 'me']
          }
        })
      }
    }))
  }

  const addReply = (postId, replyText) => {
    const displayName = localStorage.getItem('gardenpilot_display_name') || 'Gardener'
    savePosts(posts.map(p => {
      if (p.id !== postId) return p
      return {
        ...p,
        replies: [...p.replies, {
          id: Date.now(),
          displayName,
          text: replyText,
          createdAt: new Date().toISOString(),
          likes: 0,
          likedBy: []
        }]
      }
    }))
  }

  const handleReport = (post) => setReportingPost(post)

  const filteredPosts = posts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.text.toLowerCase().includes(search.toLowerCase())
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Community</h1>
          <p className="text-garden-500 text-sm mt-1">{posts.length} posts from fellow gardeners</p>
        </div>
        <button onClick={() => setShowGuidelines(true)}
          className="btn-primary text-sm flex-shrink-0">
          <Plus size={14} /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
        <input type="text" placeholder="Search posts..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-9" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 border transition-all ${
              activeCategory === cat.id
                ? 'bg-garden-600 text-white border-garden-600'
                : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">No posts yet</h3>
          <p className="text-garden-400 text-sm mb-5">Be the first to post in this category!</p>
          <button onClick={() => setShowGuidelines(true)} className="btn-primary mx-auto text-sm">
            <Plus size={14} /> Create first post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isExpanded={expandedPost === post.id}
              onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onLike={() => toggleLike(post.id)}
              onReplyLike={(replyId) => toggleReplyLike(post.id, replyId)}
              onReply={(text) => addReply(post.id, text)}
              onReport={() => handleReport(post)}
              formatTime={formatTime}
              categories={CATEGORIES}
            />
          ))}
        </div>
      )}

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-garden-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-display text-lg font-semibold text-garden-900">Community Guidelines</h3>
              </div>
              <p className="text-sm text-garden-600 leading-relaxed">
                Garden Pilot is a friendly community for gardeners of all levels. By posting, you agree to:
              </p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                '🌱 Keep it gardening related',
                '🤝 Be kind and respectful to all members',
                '📸 Only share photos you own',
                '🚫 No spam, promotions, or inappropriate content',
                '⚠️ Violations will result in immediate removal from the platform',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-garden-700">
                  <span>{rule}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={() => setShowGuidelines(false)}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm">
                Cancel
              </button>
              <button onClick={() => { setShowGuidelines(false); setShowNewPost(true) }}
                className="btn-primary flex-1 justify-center py-2.5 text-sm">
                I Agree — Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <NewPostModal
          categories={CATEGORIES.filter(c => c.id !== 'all')}
          onSave={addPost}
          onClose={() => setShowNewPost(false)}
        />
      )}

      {/* Report Modal */}
      {reportingPost && (
        <ReportModal
          post={reportingPost}
          onClose={() => setReportingPost(null)}
        />
      )}
    </div>
  )
}

// ── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, isExpanded, onToggleExpand, onLike, onReplyLike, onReply, onReport, formatTime, categories }) {
  const [replyText, setReplyText] = useState('')
  const liked = post.likedBy.includes('me')
  const cat = categories.find(c => c.id === post.category)

  const handleReply = () => {
    if (!replyText.trim()) return
    onReply(replyText.trim())
    setReplyText('')
  }

  return (
    <div className="card">
      {/* Post header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-garden-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {post.displayName?.slice(0,2).toUpperCase() || 'GP'}
          </div>
          <div>
            <p className="text-sm font-medium text-garden-900">{post.displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {post.location && <span className="text-xs text-garden-400">{post.location}</span>}
              <span className="text-garden-200">·</span>
              <span className="text-xs text-garden-400">{formatTime(post.createdAt)}</span>
              {cat && (
                <>
                  <span className="text-garden-200">·</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-garden-100 text-garden-700`}>
                    {cat.emoji} {cat.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={onReport}
          className="text-garden-300 hover:text-red-400 transition-colors flex-shrink-0 mt-1">
          <Flag size={13} />
        </button>
      </div>

      {/* Post content */}
      <h3 className="font-display text-base font-semibold text-garden-900 mb-2">{post.title}</h3>
      <p className={`text-sm text-garden-700 leading-relaxed ${!isExpanded && post.text.length > 200 ? 'line-clamp-3' : ''}`}>
        {post.text}
      </p>
      {post.text.length > 200 && (
        <button onClick={onToggleExpand} className="text-xs text-garden-500 hover:text-garden-700 mt-1 font-medium">
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Photo */}
      {post.photo && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <img src={post.photo} alt="Post" className="w-full object-cover max-h-64" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-garden-50">
        <button onClick={onLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            liked ? 'text-red-500' : 'text-garden-400 hover:text-red-400'
          }`}>
          <Heart size={15} className={liked ? 'fill-red-500' : ''} />
          {post.likes}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-garden-400">
          <MessageCircle size={15} />
          {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>

      {/* Replies */}
      {(isExpanded || post.replies.length > 0) && post.replies.length > 0 && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-garden-100">
          {post.replies.map(reply => {
            const replyLiked = reply.likedBy.includes('me')
            return (
              <div key={reply.id} className="bg-garden-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-garden-500 flex items-center justify-center text-white text-[10px] font-medium">
                      {reply.displayName?.slice(0,2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-garden-800">{reply.displayName}</span>
                    <span className="text-[11px] text-garden-400">{formatTime(reply.createdAt)}</span>
                  </div>
                  <button onClick={() => onReplyLike(reply.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      replyLiked ? 'text-red-500' : 'text-garden-300 hover:text-red-400'
                    }`}>
                    <Heart size={11} className={replyLiked ? 'fill-red-500' : ''} />
                    {reply.likes}
                  </button>
                </div>
                <p className="text-xs text-garden-700 leading-relaxed">{reply.text}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply box — always visible */}
      <div className="mt-3 flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Write a reply..."
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReply()}
        />
        <button onClick={handleReply} disabled={!replyText.trim()}
          className="btn-primary px-3 disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

// ── NEW POST MODAL ────────────────────────────────────────────────────────────
function NewPostModal({ categories, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')
  const [location, setLocation] = useState('')
  const displayName = localStorage.getItem('gardenpilot_display_name') || 'Gardener'

  const handleSave = () => {
    if (!title.trim() || !text.trim()) return
    onSave({ title: title.trim(), text: text.trim(), category, location: location.trim(), displayName, photo: null })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-garden-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-garden-900">New post</h3>
            <button onClick={onClose}><X size={20} className="text-garden-400" /></button>
          </div>
          <p className="text-xs text-garden-400 mt-1">Posting as <span className="font-medium text-garden-600">{displayName}</span></p>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    category === cat.id
                      ? 'bg-garden-600 text-white border-garden-600'
                      : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Title *</label>
            <input className="input-field" placeholder="What's on your mind?"
              value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Post *</label>
            <textarea className="input-field resize-none text-sm leading-relaxed" rows={5}
              placeholder="Share your gardening experience, ask a question, or offer advice..."
              value={text} onChange={e => setText(e.target.value)} />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              Location <span className="text-garden-400 font-normal">(city/state only — optional)</span>
            </label>
            <input className="input-field text-sm" placeholder="e.g. Nashville, TN"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          {/* Photo placeholder */}
          <div className="border-2 border-dashed border-garden-200 rounded-xl p-4 text-center">
            <Camera size={20} className="text-garden-300 mx-auto mb-1" />
            <p className="text-xs text-garden-400">Photo uploads coming soon</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-garden-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || !text.trim()}
            className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-40">
            Post to Community
          </button>
        </div>
      </div>
    </div>
  )
}

// ── REPORT MODAL ─────────────────────────────────────────────────────────────
function ReportModal({ post, onClose }) {
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!reason) return
    // In production this would send to clientcare@leadkast.com via Resend
    console.log('Report submitted:', { postId: post.id, reason })
    setSubmitted(true)
  }

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
            <div className="px-5 pt-5 pb-4 border-b border-garden-100">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-garden-900">Report post</h3>
                <button onClick={onClose}><X size={18} className="text-garden-400" /></button>
              </div>
              <p className="text-xs text-garden-400 mt-1">Why are you reporting this post?</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    reason === r
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-garden-100 bg-white text-garden-700 hover:border-garden-300'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-sm">Cancel</button>
              <button onClick={handleSubmit} disabled={!reason}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors">
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
