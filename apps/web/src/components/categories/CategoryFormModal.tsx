'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Sparkles,
  Palette,
  Layers,
  Search,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AVAILABLE_ICONS, PRESET_COLORS } from './iconList';
import { CategoryIcon } from './CategoryIcon';
import {
  createCategory,
  updateCategory,
  CategoryItem,
} from '@/utils/api/categories';

const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar los 50 caracteres'),
  icon: z.string().min(1, 'Selecciona un ícono'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color hexadecimal inválido (ej: #10B981)'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrCreated: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryFormModalProps) {
  const [iconSearch, setIconSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Todos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEditing = Boolean(categoryToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'ShoppingCart',
      color: '#10B981',
    },
  });

  const watchedName = watch('name');
  const watchedIcon = watch('icon');
  const watchedColor = watch('color');

  useEffect(() => {
    if (categoryToEdit) {
      reset({
        name: categoryToEdit.name,
        icon: categoryToEdit.icon || 'ShoppingCart',
        color: categoryToEdit.color || '#10B981',
      });
    } else {
      reset({
        name: '',
        icon: 'ShoppingCart',
        color: '#10B981',
      });
    }
    setApiError(null);
    setIconSearch('');
  }, [categoryToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const iconCategories = [
    'Todos',
    ...Array.from(new Set(AVAILABLE_ICONS.map((i) => i.category))),
  ];

  const filteredIcons = AVAILABLE_ICONS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.label.toLowerCase().includes(iconSearch.toLowerCase());
    const matchesTab =
      selectedCategoryTab === 'Todos' || item.category === selectedCategoryTab;
    return matchesSearch && matchesTab;
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      if (isEditing && categoryToEdit) {
        const updated = await updateCategory(categoryToEdit.id, {
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
        });
        onSuccess(updated);
      } else {
        const created = await createCategory({
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la categoría';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950 backdrop-blur-xl sm:p-8 z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors shadow-lg"
              style={{
                backgroundColor: `${watchedColor || '#10B981'}20`,
                color: watchedColor || '#10B981',
                boxShadow: `0 4px 14px ${watchedColor || '#10B981'}30`,
              }}
            >
              <CategoryIcon name={watchedIcon} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Modifica los datos visuales de tu categoría'
                  : 'Crea una categoría para organizar y trackear tus gastos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Vista Previa
          </span>
          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3.5 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all"
                style={{
                  backgroundColor: `${watchedColor || '#10B981'}25`,
                  color: watchedColor || '#10B981',
                  border: `1px solid ${watchedColor || '#10B981'}50`,
                }}
              >
                <CategoryIcon name={watchedIcon} className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">
                  {watchedName || 'Nombre de Categoría'}
                </p>
                <span className="text-[11px] text-slate-400">
                  0 gastos vinculados
                </span>
              </div>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${watchedColor || '#10B981'}15`,
                color: watchedColor || '#10B981',
                border: `1px solid ${watchedColor || '#10B981'}40`,
              }}
            >
              {watchedColor || '#10B981'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Error Alert */}
          {apiError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              placeholder="Ej: Supermercado, Alquiler, Salidas..."
              {...register('name')}
              className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? 'border-red-500/50 focus:ring-red-500/40'
                  : 'border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20'
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-emerald-400" />
                Color de Identificación
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {watchedColor}
              </span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((c) => {
                const isSelected = watchedColor?.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setValue('color', c.hex, { shouldValidate: true })}
                    className={`group relative flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'scale-110 ring-2 ring-white shadow-lg'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={watchedColor || '#10B981'}
                  onChange={(e) =>
                    setValue('color', e.target.value, { shouldValidate: true })
                  }
                  className="h-8 w-8 cursor-pointer appearance-none rounded-xl border border-slate-700 bg-transparent p-0 overflow-hidden"
                  title="Color personalizado"
                />
              </div>
            </div>
            {errors.color && (
              <p className="mt-1.5 text-xs text-red-400">{errors.color.message}</p>
            )}
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Seleccionar Ícono
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {watchedIcon}
              </span>
            </label>

            {/* Icon Category Tabs & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar ícono por nombre o categoría..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {iconCategories.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedCategoryTab(tab)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                      selectedCategoryTab === tab
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Icons Grid */}
            <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-2.5 grid grid-cols-6 sm:grid-cols-8 gap-2">
              {filteredIcons.map((item) => {
                const isSelected = watchedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.label}
                    onClick={() =>
                      setValue('icon', item.name, { shouldValidate: true })
                    }
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/60 shadow-md'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <CategoryIcon name={item.name} className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
            {errors.icon && (
              <p className="mt-1.5 text-xs text-red-400">{errors.icon.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Categoría'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
