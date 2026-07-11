"use client";

import { useActionState } from "react";
import { updateUserRole, deleteUser } from "./actions";

interface ActionState {
  error?: string;
}

const initialState: ActionState = {};

export function UserRow({
  user,
  isSelf,
}: {
  user: { id: string; email: string; role: string; createdAt: string };
  isSelf: boolean;
}) {
  const [roleState, roleAction, isRolePending] = useActionState(updateUserRole, initialState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteUser, initialState);

  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
        {user.email}
        {isSelf && <span className="ml-1.5 text-xs text-gray-400">(あなた)</span>}
      </td>
      <td className="px-4 py-2">
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={isSelf}
            className="rounded-card border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            type="submit"
            disabled={isSelf || isRolePending}
            className="rounded-card bg-gray-100 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isRolePending ? "変更中..." : "変更"}
          </button>
        </form>
        {roleState.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{roleState.error}</p>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
        {new Date(user.createdAt).toLocaleDateString("ja-JP")}
      </td>
      <td className="px-4 py-2">
        {!isSelf && (
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(`${user.email} を削除しますか？`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              disabled={isDeletePending}
              className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              {isDeletePending ? "削除中..." : "削除"}
            </button>
          </form>
        )}
        {deleteState.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{deleteState.error}</p>
        )}
      </td>
    </tr>
  );
}
