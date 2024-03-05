import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import useSWR from "swr";

const fetcher = (args: string) => fetch(args).then((res) => res.json());

type TData = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const Home: NextPage = () => {
  const { data, isLoading } = useSWR(
    "https://jsonplaceholder.typicode.com/posts",
    fetcher
  );

  const columns = useMemo<ColumnDef<TData>[]>(
    () => [
      {
        header: "userId",
        accessorKey: "userId",
      },
      {
        header: "Id",
        accessorKey: "id",
      },
      {
        header: "Title",
        accessorKey: "title",
      },
    ],
    []
  );

  const table = useReactTable({
    data: data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  });

  if (!table || isLoading) return <></>;
  return (
    <main className={styles.main}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ margin: "5px" }}>
        <span>Page</span>
        <strong>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </strong>
      </div>
      <div>
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
      </div>
      <select
        style={{ margin: "10px" }}
        value={table.getState().pagination.pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
        }}
      >
        {[10, 20, 30, 40, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>
      <div>{table.getRowModel().rows.length} Rows</div>
    </main>
  );
};

export default Home;