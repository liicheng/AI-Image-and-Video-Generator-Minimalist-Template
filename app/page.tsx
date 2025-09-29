import {redirect} from 'next/navigation';

export default function Root() {
  redirect('/en'); // ← 或 '/zh'，与 defaultLocale 保持一致
}