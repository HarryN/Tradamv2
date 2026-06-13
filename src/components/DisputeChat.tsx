'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/auth-context';
import { 
  getDisputeMessages, 
  getDisputeEvidence,
  sendDisputeMessage, 
  addDisputeEvidence,
  DisputeMessage,
} from '@/services/dispute-service';
import { DisputeEvidence } from '@/types';
import { Send, Loader2, User, ShieldCheck, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';

interface DisputeChatProps {
  disputeId: string;
}

export default function DisputeChat({ disputeId }: DisputeChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [evidence, setEvidence] = useState<(DisputeEvidence & { viewUrl?: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    loadEvidence();

    // Subscribe to new messages
    const channel = supabase
      .channel(`dispute-chat-${disputeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dispute_messages',
        filter: `dispute_id=eq.${disputeId}`
      }, () => {
        loadMessages();
        loadEvidence();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [disputeId]);

  const resolveEvidenceUrl = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const { data, error } = await supabase.storage
      .from('dispute-evidence')
      .createSignedUrl(url, 60 * 60);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL for evidence:', error);
      return url;
    }

    return data.signedUrl;
  };

  const loadEvidence = async () => {
    setEvidenceLoading(true);
    try {
      const data = await getDisputeEvidence(disputeId);
      const loadedEvidence = await Promise.all(
        data.map(async (item) => ({
          ...item,
          viewUrl: await resolveEvidenceUrl(item.evidence_url),
        }))
      );
      setEvidence(loadedEvidence);
    } catch (err) {
      console.error('Failed to load dispute evidence:', err);
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await getDisputeMessages(disputeId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${disputeId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(uploadError.message || 'Storage upload failed');
      }

      const type = file.type.startsWith('image/') ? 'image' : 'document';
      
      await addDisputeEvidence(disputeId, user.id, type, filePath, file.name);
      
      // Send a system message about the evidence
      await sendDisputeMessage(disputeId, user.id, `📎 Uploaded evidence: ${file.name}`);
      
      loadMessages();
      loadEvidence();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    // Optimistic Update
    const tempId = Math.random().toString();
    const optimisticMessage: DisputeMessage = {
      id: tempId,
      dispute_id: disputeId,
      sender_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_profile: {
        email: user.email || '',
        role: 'buyer' // Default, will be refreshed
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await sendDisputeMessage(disputeId, user.id, messageText);
      // Realtime subscription will handle the permanent message addition
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore the text
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="mt-2 text-xs font-bold text-neutral-muted uppercase tracking-widest">Loading Conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-neutral-border overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-neutral-border bg-neutral-bg/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-neutral-text">Resolution Chat</span>
        </div>
        <div className="flex items-center gap-4">
           {error && (
             <span className="text-[10px] font-bold text-red-500 animate-pulse">{error}</span>
           )}
           <span className="text-[10px] font-bold text-neutral-muted">End-to-end encrypted</span>
           <button 
             onClick={() => {
               setError(null);
               fileInputRef.current?.click();
             }}
             disabled={uploading}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-border text-[10px] font-black uppercase tracking-wider text-neutral-text hover:bg-neutral-bg transition-all disabled:opacity-50 cursor-pointer"
           >
             {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
             {uploading ? 'Uploading...' : 'Add Proof'}
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             className="hidden" 
             accept="image/*,.pdf,.doc,.docx"
           />
        </div>
      </div>

      {/* Evidence Attachments */}
      {evidenceLoading ? (
        <div className="px-6 py-4 border-b border-neutral-border bg-neutral-bg/50 text-sm text-neutral-muted">Loading evidence...</div>
      ) : evidence.length > 0 ? (
        <div className="px-6 py-4 border-b border-neutral-border bg-neutral-bg/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest font-black text-neutral-muted">Evidence</p>
            <span className="text-[11px] font-bold text-neutral-text">{evidence.length} item{evidence.length === 1 ? '' : 's'}</span>
          </div>
          <div className="grid gap-3">
            {evidence.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-neutral-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-text">{item.description || item.evidence_url.split('/').pop()}</p>
                    <p className="text-[11px] text-neutral-muted">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-muted">{item.evidence_type}</span>
                </div>
                {item.viewUrl ? (
                  <div className="flex gap-3 flex-wrap">
                    <a
                      href={item.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-primary underline"
                    >
                      Open
                    </a>
                    <a
                      href={item.viewUrl}
                      download
                      className="text-[11px] font-bold text-neutral-text underline"
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-muted">Unable to resolve file URL.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
             <div className="p-4 rounded-full bg-neutral-bg">
                <Send className="w-6 h-6 text-neutral-muted" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            // Without sender_profile join, we can't determine role. Default to false.
            const isAdmin = false; // msg.sender_profile?.role === 'admin';
            const isEvidence = msg.message.startsWith('📎 Uploaded evidence:');

            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : isAdmin 
                      ? 'bg-neutral-text text-white rounded-tl-none border border-neutral-text' 
                      : 'bg-neutral-bg text-neutral-text rounded-tl-none border border-neutral-border'
                } ${isEvidence ? 'border-dashed opacity-90' : ''}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                       {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                       <span className="text-[10px] font-black uppercase tracking-wider">
                          {isAdmin ? 'Platform Admin' : 'Other Party'}
                       </span>
                    </div>
                  )}
                  {isEvidence ? (
                    <div className="flex items-center gap-2">
                       <div className="p-2 rounded-lg bg-white/20">
                          <FileText className="w-4 h-4" />
                       </div>
                       <p className="text-sm font-bold truncate">{msg.message.replace('📎 Uploaded evidence: ', '')}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                  )}
                </div>
                <span className="text-[9px] font-bold text-neutral-muted mt-1 uppercase tracking-tighter">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 bg-white border-t border-neutral-border"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-neutral-border bg-neutral-bg/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-2 p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
