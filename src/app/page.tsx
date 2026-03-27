'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ArrowRight, ListFilter, LayoutGrid, Cloud, CloudOff } from 'lucide-react';

/**
 * 注意: ローカル環境（VS Code）で実行する場合は、
 * ターミナルで `npm install @supabase/supabase-js` を実行済みであることを確認してください。
 */
import { createClient } from '@supabase/supabase-js';

// --- Supabase設定 ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export default function App() {
  const [todos, setTodos] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [isSyncing, setIsSyncing] = useState(false);

  // 初期データ取得
  useEffect(() => {
    if (supabase) {
      fetchTodos();
    }
  }, []);

  const fetchTodos = async () => {
    if (!supabase) return;
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
    if (!inputValue.trim() || !supabase) return;

    const newTodo = {
      text: inputValue,
      completed: false,
      category: 'inbox'
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
    if (!supabase) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('todos').update({ category }).eq('id', id);
      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, category } : t));
      }
    } catch (e) {
      console.error("Update category error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTodo = async (id: any, currentStatus: boolean) => {
    if (!supabase) return;
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
    if (!supabase) return;
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Focus Matrix 
              {supabase ? (
                <Cloud size={18} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"} />
              ) : (
                <CloudOff size={18} className="text-red-400" />
              )}
            </h1>
            <p className="text-slate-500 text-sm">クラウド同期中</p>
          </div>
          <div className="flex bg-slate-200/50 rounded-lg p-1 backdrop-blur-sm">
            <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-white shadow-sm font-bold' : 'text-slate-600'}`}>リスト</button>
            <button onClick={() => setViewMode('matrix')} className={`px-4 py-1.5 rounded-md text-sm transition-all ${viewMode === 'matrix' ? 'bg-white shadow-sm font-bold' : 'text-slate-600'}`}>マトリクス</button>
          </div>
        </header>

        <form onSubmit={addTodo} className="flex gap-2 mb-8">
          <input 
            className="flex-1 border-none shadow-sm p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
            placeholder="頭の中にあることを書き出す..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">追加</button>
        </form>

        {!SUPABASE_URL && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            SupabaseのURLとキーを設定すると、クラウド保存が有効になります。
          </div>
        )}

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h2 className="font-bold text-slate-400 text-xs uppercase tracking-widest px-2 text-center md:text-left">Inbox</h2>
              <div className="space-y-3">
                {todos.filter(t => t.category === 'inbox').map(todo => (
                  <div key={todo.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-700">{todo.text}</span>
                      <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(categories).filter(([k]) => k !== 'inbox').map(([key, val]: any) => (
                        <button key={key} onClick={() => updateCategory(todo.id, key)} className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-500 hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {Object.entries(categories).filter(([k]) => k !== 'inbox').map(([key, val]: any) => {
                const items = todos.filter(t => t.category === key);
                if (items.length === 0) return null;
                return (
                  <div key={key} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${val.color.split(' ')[0]}`}></span>
                      {val.label}
                    </h3>
                    <div className="space-y-1">
                      {items.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleTodo(todo.id, todo.completed)} className="text-indigo-500">
                              {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} className="text-slate-200" />}
                            </button>
                            <span className={todo.completed ? 'line-through text-slate-300' : 'text-slate-600 font-medium'}>{todo.text}</span>
                          </div>
                          <button onClick={() => updateCategory(todo.id, 'inbox')} className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">戻す</button>
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
              <div key={key} className={`p-6 rounded-[2rem] border-2 border-dashed min-h-[200px] transition-colors ${val.color}`}>
                <h3 className="font-bold mb-4 text-slate-800 flex justify-between">
                  {val.label}
                  <span className="text-xs opacity-50">{todos.filter(t => t.category === key).length}</span>
                </h3>
                <div className="space-y-2">
                  {todos.filter(t => t.category === key).map(todo => (
                    <div key={todo.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-sm flex justify-between items-center group">
                      <span className={todo.completed ? 'line-through opacity-30' : ''}>{todo.text}</span>
                      <button onClick={() => updateCategory(todo.id, 'inbox')} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}