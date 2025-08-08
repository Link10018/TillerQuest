import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
} from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { User } from "@prisma/client";
import { useState } from "react";
import Link from "next/link";

const columns: GridColDef[] = [
  { field: "name", headerName: "First name", width: 160 },
  {
    field: "username",
    headerName: "Username",
    cellClassName: "text-green-300",
    width: 160,
  },
  { field: "lastname", headerName: "Last name", width: 160 },
  {
    field: "hp",
    headerName: "HP",
    cellClassName: "text-red-400",
  },
  { field: "mana", headerName: "MP", cellClassName: "text-blue-400" },
  { field: "xp", headerName: "XP", cellClassName: "text-orange-400" },
  { field: "level", headerName: "Level", cellClassName: "text-green-300" },
  { field: "class", headerName: "Class", cellClassName: "text-purple-400" },
  {
    field: "guildName",
    headerName: "Guild",
    cellClassName: "text-yellow-400",
    width: 200,
  },
  {
    field: "schoolClass",
    headerName: "School Class",
    type: "string",
    filterable: true,
    width: 150,
    valueGetter: (params: string) => params && params.split("_")[1],
  },
  {
    field: "Profilepage",
    headerName: "Profile",
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Link
        href={`/profile/${params.row.username}`}
        className="text-blue-400 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {params.row.username}
      </Link>
    ),
  },
];

const paginationModel = { page: 0, pageSize: 30 };

export default function NewUserList({
  users,
  setSelectedUsers,
}: {
  users: User[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>;
}) {
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  return (
    <Paper sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <DataGrid
        rows={users}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[30, 45, 60, 120]}
        checkboxSelection
        classes={{ cell: " cursor-pointer" }}
        onRowSelectionModelChange={(newSelection) => {
          const selectedUsernames = newSelection.map(
            (id) => users.find((user) => user.id === id)?.username,
          );
          setSelectedUsers(
            users.filter((user) => selectedUsernames.includes(user.username)),
          );
          setRowSelectionModel(newSelection);
        }}
        rowSelectionModel={rowSelectionModel}
        sx={{ border: 0 }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </Paper>
  );
}
