'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ArrowRight, ListFilter, LayoutGrid, Cloud, CloudOff, LogIn, LogOut, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 環境変数から読み込む ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. 認証状態の監視
  useEffect(() => {
    if (!supabase) return;

    // 現在のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 状態変化をリスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. ユーザーがログインしたらデータを取得
  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
    }
  }, [user]);

  const handleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const fetchTodos = async () => {
    if (!supabase || !user) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setTodos(data || []);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !supabase || !user) return;

    const newTodo = {
      text: inputValue,
      completed: false,
      category: 'inbox',
      user_id: user.id // ユーザーIDを紐付け
    };

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('todos').insert([newTodo]).select();
      if (!error && data) {
        setTodos([data[0], ...todos]);
      }
    } catch (e) {
      console.error("Add error:", e);
    } finally {
      setInputValue('');
      setIsSyncing(false);
    }
  };

  const updateCategory = async (id: any, category: string) => {
    if (!supabase || !user) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('todos').update({ category }).eq('id', id);
      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, category } : t));
      }
    } catch (e) {
      console.error("Update error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTodo = async (id: any, currentStatus: boolean) => {
    if (!supabase || !user) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('todos').update({ completed: !currentStatus }).eq('id', id);
      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
      }
    } catch (e) {
      console.error("Toggle error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteTodo = async (id: any) => {
    if (!supabase || !user) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (!error) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const categories: any = {
    inbox: { label: '未分類', color: 'bg-gray-100' },
    urgent_important: { label: '重要・緊急', color: 'bg-red-50 border-red-100' },
    not_urgent_important: { label: '重要・非緊急', color: 'bg-blue-50 border-blue-100' },
    urgent_not_important: { label: '非重要・緊急', color: 'bg-yellow-50 border-yellow-100' },
    not_urgent_not_important: { label: '不要・保留', color: 'bg-gray-100 border-gray-200' }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                Focus Matrix 
                {supabase && user ? (
                  <Cloud size={18} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"} />
                ) : (
                  <CloudOff size={18} className="text-slate-300" />
                )}
              </h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Eisenhower Matrix Tool</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-slate-100">
                <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-slate-100" alt="avatar" />
                <span className="text-sm font-bold text-slate-600 hidden sm:inline">{user.user_metadata.full_name}</span>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="ログアウト">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white px-6 py-2.5 rounded-full shadow-sm border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <LogIn size={18} className="text-indigo-600" /> Googleでログイン
              </button>
            )}
            
            <div className="flex bg-slate-200/50 rounded-xl p-1 ml-2">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><ListFilter size={18} /></button>
              <button onClick={() => setViewMode('matrix')} className={`p-2 rounded-lg transition-all ${viewMode === 'matrix' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
            </div>
          </div>
        </header>

        {user ? (
          <>
            <form onSubmit={addTodo} className="flex gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <input 
                className="flex-1 p-5 rounded-[1.5rem] border-0 shadow-xl shadow-indigo-100/20 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition-all"
                placeholder="新しいタスクを頭から吐き出す..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button className="bg-indigo-600 text-white px-10 rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-200">追加</button>
            </form>

            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                  <h2 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] px-2">Inbox</h2>
                  <div className="space-y-3">
                    {todos.filter(t => t.category === 'inbox').map(todo => (
                      <div key={todo.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-5 group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-700 leading-snug">{todo.text}</span>
                          <button onClick={() => deleteTodo(todo.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(categories).filter(([k]) => k !== 'inbox').map(([key, val]: any) => (
                            <button key={key} onClick={() => updateCategory(todo.id, key)} className="text-[9px] font-bold bg-slate-50 px-2 py-2 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">
                              {val.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {todos.filter(t => t.category === 'inbox').length === 0 && (
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-300 font-bold text-sm">Inbox is empty</div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {Object.entries(categories).filter(([k]) => k !== 'inbox').map(([key, val]: any) => {
                    const items = todos.filter(t => t.category === key);
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 animate-in fade-in slide-in-from-right-4">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-sm uppercase tracking-wider">
                          <span className={`w-2.5 h-2.5 rounded-full ${val.color.split(' ')[0]}`}></span>
                          {val.label}
                        </h3>
                        <div className="space-y-1">
                          {items.map(todo => (
                            <div key={todo.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl group transition-all">
                              <div className="flex items-center gap-4">
                                <button onClick={() => toggleTodo(todo.id, todo.completed)} className="transition-transform active:scale-90">
                                  {todo.completed ? <CheckCircle2 size={24} className="text-indigo-500" /> : <Circle size={24} className="text-slate-200 hover:text-indigo-200" />}
                                </button>
                                <span className={`font-bold ${todo.completed ? 'line-through text-slate-300' : 'text-slate-600'}`}>{todo.text}</span>
                              </div>
                              <button onClick={() => updateCategory(todo.id, 'inbox')} className="text-[10px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-tighter">Restore to Inbox</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                {Object.entries(categories).filter(([k]) => k !== 'inbox').map(([key, val]: any) => (
                  <div key={key} className={`p-8 rounded-[3rem] border-2 border-dashed min-h-[220px] transition-all ${val.color}`}>
                    <h3 className="font-black mb-6 text-slate-800 flex justify-between items-center text-sm uppercase tracking-widest">
                      {val.label}
                      <span className="bg-white/50 px-3 py-1 rounded-full text-[10px]">{todos.filter(t => t.category === key).length}</span>
                    </h3>
                    <div className="space-y-2">
                      {todos.filter(t => t.category === key).map(todo => (
                        <div key={todo.id} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm text-sm font-bold flex justify-between items-center group animate-in zoom-in-95">
                          <span className={todo.completed ? 'opacity-30 line-through' : ''}>{todo.text}</span>
                          <button onClick={() => updateCategory(todo.id, 'inbox')} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all">
                            <ArrowRight size={16} className="rotate-180" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <User size={40} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">ログインが必要です</h2>
            <p className="text-slate-500 mb-8 max-w-xs text-center font-medium">クラウド同期を有効にして、どのデバイスからでもタスクを管理できるようにしましょう。</p>
            <button 
              onClick={handleLogin}
              className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-200 flex items-center gap-3"
            >
              <LogIn size={20} /> 今すぐログイン
            </button>
          </div>
        )}
      </div>
    </main>
  );
}