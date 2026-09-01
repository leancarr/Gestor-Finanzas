'use client';

import React from 'react';
import { Edit2, Trash2, Calendar, Receipt } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { CategoryItem } from '@/utils/api/categories';

interface CategoryCardProps {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const color = category.color || '#10B981';
  const expensesCount = category._count?.expenses || 0;

  return (
    <div className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-slate-950/50 flex flex-col justify-between">
      <div>
        {/* Top Header: Icon + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shadow-md"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`,
              boxShadow: `0 4px 20px ${color}25`,
            }}
          >
            <CategoryIcon name={category.icon} className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
            <button
              onClick={() => onEdit(category)}
              title="Editar categoría"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(category)}
              title="Eliminar categoría"
              className="rounded-xl p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Details */}
        <div className="mt-4">
          <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
            {category.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${color}15`,
                color: color,
                border: `1px solid ${color}35`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {color}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-2.5 py-0.5 text-[10px] text-slate-400 border border-slate-700/50">
              <Receipt className="h-2.5 w-2.5 text-slate-400" />
              {expensesCount === 1 ? '1 gasto' : `${expensesCount} gastos`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(category.createdAt).toLocaleDateString('es-AR', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span className="font-mono text-[10px] text-slate-600 truncate max-w-[80px]">
          {category.icon || 'Tag'}
        </span>
      </div>
    </div>
  );
}
