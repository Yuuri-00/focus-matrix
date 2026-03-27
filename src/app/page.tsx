'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ArrowRight, ListFilter, LayoutGrid } from 'lucide-react';

export default function App() {
  const [todos, setTodos] = useState<{ id: number; text: string; completed: boolean; category: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [isLoaded, setIsLoaded] = useState(false);

  // ローカルストレージから読み込み
  useEffect(() => {
    const saved = localStorage.getItem('focus-matrix-todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load todos", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 保存
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('focus-matrix-todos', JSON.stringify(todos));
    }
  }, [todos, isLoaded]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      category: 'inbox'
    };
    setTodos([newTodo, ...todos]);
    setInputValue('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const updateCategory = (id: number, category: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, category } : todo
    ));
  };

  const categories = {
    inbox: { label: '未分類', color: 'bg-gray-100' },
    urgent_important: { label: '重要・緊急', color: 'bg-red-100 border-red-200' },
    not_urgent_important: { label: '重要・非緊急', color: 'bg-blue-100 border-blue-200' },
    urgent_not_important: { label: '非重要・緊急', color: 'bg-yellow-100 border-yellow-200' },
    not_urgent_not_important: { label: '不要・保留', color: 'bg-gray-200 border-gray-300' }
  };

  const MatrixQuadrant = ({ type, title, items }: { type: string, title: string, items: typeof todos }) => (
    <div className={`flex flex-col h-64 p-4 rounded-xl border-2 border-dashed ${categories[type as keyof typeof categories].color}`}>
      <h3 className="font-bold text-gray-800 mb-2 flex items-center justify-between">
        {title}
        <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm">{items.length}</span>
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.map(todo => (
          <div key={todo.id} className="bg-white p-2 rounded shadow-sm text-sm group flex justify-between items-center">
            <span className={todo.completed ? 'line-through text-gray-400' : ''}>{todo.text}</span>
            <button onClick={() => updateCategory(todo.id, 'inbox')} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100">
              <ArrowRight size={14} className="rotate-180" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Focus Matrix</h1>
            <p className="text-slate-500 text-sm">タスクを整理して、集中を最大化しましょう</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow-sm border text-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ListFilter size={16} className="mr-2" /> リスト
            </button>
            <button 
              onClick={() => setViewMode('matrix')}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={16} className="mr-2" /> マトリクス
            </button>
          </div>
        </header>

        <form onSubmit={addTodo} className="mb-8 flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-3 rounded-xl border-0 shadow-md focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center font-medium">
            <Plus size={20} className="mr-1" /> 追加
          </button>
        </form>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center uppercase tracking-wider">Inbox</h2>
              <div className="space-y-3">
                {todos.filter(t => t.category === 'inbox').map(todo => (
                  <div key={todo.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group">
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-medium text-slate-800">{todo.text}</span>
                      <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(categories).filter(([key]) => key !== 'inbox').map(([key, value]) => (
                        <button 
                          key={key}
                          onClick={() => updateCategory(todo.id, key)}
                          className="text-[10px] px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 transition-colors"
                        >
                          {value.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {Object.entries(categories).filter(([key]) => key !== 'inbox').map(([key, cat]) => {
                const items = todos.filter(t => t.category === key);
                if (items.length === 0) return null;
                return (
                  <div key={key} className="p-5 rounded-2xl border-l-4 shadow-sm bg-white border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">{cat.label}</h3>
                    <div className="space-y-2">
                      {items.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group">
                          <div className="flex items-center space-x-3">
                            <button onClick={() => toggleTodo(todo.id)} className="text-indigo-500">
                              {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                            </button>
                            <span className={todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}>{todo.text}</span>
                          </div>
                          <button onClick={() => updateCategory(todo.id, 'inbox')} className="opacity-0 group-hover:opacity-100 text-xs text-indigo-600">戻す</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-3xl shadow-xl">
            <MatrixQuadrant type="urgent_important" title="Do (すぐやる)" items={todos.filter(t => t.category === 'urgent_important')} />
            <MatrixQuadrant type="not_urgent_important" title="Schedule (計画)" items={todos.filter(t => t.category === 'not_urgent_important')} />
            <MatrixQuadrant type="urgent_not_important" title="Delegate (任せる)" items={todos.filter(t => t.category === 'urgent_not_important')} />
            <MatrixQuadrant type="not_urgent_not_important" title="Eliminate (不要)" items={todos.filter(t => t.category === 'not_urgent_not_important')} />
          </div>
        )}
      </div>
    </main>
  );
}