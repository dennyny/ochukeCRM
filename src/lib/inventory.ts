import { supabase } from './supabase'

export interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  price: number
  created_at?: string
}

export async function fetchInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as InventoryItem[]
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('inventory')
    .insert([item])
    .select()
  if (error) throw error
  return data?.[0] as InventoryItem
}

export async function updateInventoryItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0] as InventoryItem
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
