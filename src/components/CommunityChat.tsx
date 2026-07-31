import React, { useState, useEffect, useRef } from 'react';
import { User, CommunityPost, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { MessageSquare, Send, Paperclip, FileText, Trash2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface CommunityChatProps {
  user: User | null;
  lang: LanguageCode;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({ user, lang }) => {
  const t = TRANSLATIONS[lang];
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('new_community_post', (newPost: CommunityPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    loadPosts();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const loadPosts = async () => {
    try {
      const talukQuery = user?.taluk ? `?taluk=${encodeURIComponent(user.taluk)}` : '';
      const res = await fetch(`/api/community/posts${talukQuery}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to load community posts', err);
    }
  };

  const handleSendText = async () => {
    if (!text.trim() || !user) return;

    try {
      const res = await fetch('/api/community/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'text',
          content: text.trim()
        })
      });
      if (res.ok) {
        setText('');
      }
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        let type: 'image' | 'audio' | 'video' | 'pdf' = 'image';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.includes('pdf')) type = 'pdf';

        await fetch('/api/community/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            type,
            content: uploadData.url
          })
        });
      }
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!user || !confirm('Delete post?')) return;
    try {
      const res = await fetch(`/api/community/post/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Failed to delete post');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 max-w-2xl mx-auto border-x border-slate-200">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-3.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-300" />
          <div>
            <h2 className="font-bold text-base leading-tight">{t.community}</h2>
            <p className="text-[11px] text-emerald-200">
              {user?.taluk ? `${user.taluk} Farmers Group` : 'Kisan Digital Forum'}
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {posts.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-10 font-medium">
            No posts yet. Start the conversation with fellow farmers!
          </div>
        ) : (
          posts.map((post) => {
            const isMine = user && post.user_id === user.id;
            return (
              <div
                key={post.id}
                className={`bg-white p-3 rounded-2xl shadow-2xs border border-slate-200 space-y-1.5 ${
                  isMine ? 'border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    👤 {post.user_name || 'Farmer'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-slate-300 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-800 pt-1">
                  {post.type === 'text' && <p className="font-medium">{post.content}</p>}
                  {post.type === 'image' && (
                    <img
                      src={post.content}
                      alt="Attachment"
                      className="rounded-xl max-h-64 object-cover border border-slate-200"
                    />
                  )}
                  {post.type === 'audio' && (
                    <audio controls src={post.content} className="w-full mt-1" />
                  )}
                  {post.type === 'video' && (
                    <video controls src={post.content} className="w-full rounded-xl max-h-64 mt-1" />
                  )}
                  {post.type === 'pdf' && (
                    <a
                      href={post.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:underline"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>View PDF Document</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={postsEndRef} />
      </div>

      {/* Input Bar */}
      {user ? (
        <div className="p-2.5 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-300 focus-within:border-emerald-600 transition">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,audio/*,video/*,.pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-full transition shadow-2xs"
              title="Attach Image/Audio/Video/PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder={uploading ? 'Uploading attachment...' : 'Write message to farmers...'}
              disabled={uploading}
              className="flex-1 bg-transparent px-2 text-sm text-slate-800 focus:outline-hidden font-medium"
            />
            <button
              onClick={handleSendText}
              disabled={!text.trim() || uploading}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-full transition shadow-2xs"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-center text-xs font-bold text-amber-900">
          Please sign in to participate in the community discussion.
        </div>
      )}
    </div>
  );
};
