import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

type Book = {
  title: string;
  author: string;
};

const books: Book[] = [
  {
    title: 'ハリー・ポッターと賢者の石',
    author: 'J.K.ローリング',
  },
  {
    title: 'こころ',
    author: '夏目漱石',
  },
];

const columns: ColumnDef<Book, any>[] = [
  {
    accessorKey: 'title',
    header: 'タイトル',
  },
  {
    accessorKey: 'author',
    header: '著者',
  },
];

export const BasicTable: React.FC = () => {
  const table = useReactTable<Book>({
    data: books,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};