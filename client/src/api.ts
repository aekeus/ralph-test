import axios from 'axios';
import type { Todo, Subtask, Tag } from './types';

const api = axios.create({
  baseURL: '/api/todos',
});

export interface FetchTodosParams {
  search?: string;
  status?: 'active' | 'completed' | 'overdue';
  priority?: 'high' | 'medium' | 'low';
  sort?: 'newest' | 'due_date' | 'priority';
}

export async function fetchTodos(params?: FetchTodosParams): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/', { params });
  return data;
}

export async function addTodo(title: string, dueDate?: string, priority?: 'low' | 'medium' | 'high'): Promise<Todo> {
  const { data } = await api.post<Todo>('/', { title, due_date: dueDate ?? null, priority: priority ?? 'medium' });
  return data;
}

export async function updateTodoPriority(id: number, priority: 'low' | 'medium' | 'high'): Promise<Todo> {
  const { data } = await api.put<Todo>(`/${id}`, { priority });
  return data;
}

export async function updateTodoTitle(id: number, title: string): Promise<Todo> {
  const { data } = await api.put<Todo>(`/${id}`, { title });
  return data;
}

export async function toggleTodo(todo: Todo): Promise<Todo> {
  const { data } = await api.put<Todo>(`/${todo.id}`, {
    completed: !todo.completed,
  });
  return data;
}

export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/${id}`);
}

export async function reorderTodos(orders: { id: number; position: number }[]): Promise<void> {
  await api.put('/reorder', { orders });
}

export async function fetchSubtasks(todoId: number): Promise<Subtask[]> {
  const { data } = await api.get<Subtask[]>(`/${todoId}/subtasks`);
  return data;
}

export async function addSubtask(todoId: number, title: string): Promise<Subtask> {
  const { data } = await api.post<Subtask>(`/${todoId}/subtasks`, { title });
  return data;
}

export async function toggleSubtask(todoId: number, subtask: Subtask): Promise<Subtask> {
  const { data } = await api.put<Subtask>(`/${todoId}/subtasks/${subtask.id}`, {
    completed: !subtask.completed,
  });
  return data;
}

export async function deleteSubtask(todoId: number, subtaskId: number): Promise<void> {
  await api.delete(`/${todoId}/subtasks/${subtaskId}`);
}

export async function fetchTags(): Promise<Tag[]> {
  const { data } = await axios.get<Tag[]>('/api/tags');
  return data;
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const { data } = await axios.post<Tag>('/api/tags', { name, color });
  return data;
}

export async function addTagToTodo(todoId: number, tagId: number): Promise<Tag[]> {
  const { data } = await api.post<Tag[]>(`/${todoId}/tags`, { tag_id: tagId });
  return data;
}

export async function removeTagFromTodo(todoId: number, tagId: number): Promise<void> {
  await api.delete(`/${todoId}/tags/${tagId}`);
}

export function exportJsonUrl(): string {
  return '/api/export/json';
}

export function exportCsvUrl(): string {
  return '/api/export/csv';
}
