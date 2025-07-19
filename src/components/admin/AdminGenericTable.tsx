import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface ColumnDefinition<T> {
  key: keyof T | "actions" | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean; // Add sortable property
}

interface AdminGenericTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDefinition<T>[];
  title: string;
  searchPlaceholder?: string; // Rendre optionnel
  emptyMessage: string;
  loadingMessage: string;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
  loading: boolean;
  searchTerm?: string; // Nouvelle prop
  onSearchChange?: (term: string) => void; // Nouvelle prop
}

const AdminGenericTable = <T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder,
  emptyMessage,
  loadingMessage,
  onAdd,
  onEdit,
  onDelete,
  isSubmitting,
  loading,
  searchTerm: propSearchTerm, // Renommer pour éviter le conflit
  onSearchChange: propOnSearchChange, // Renommer pour éviter le conflit
}: AdminGenericTableProps<T>) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const currentSearchTerm = propSearchTerm !== undefined ? propSearchTerm : internalSearchTerm;
  const currentSetSearchTerm = propOnSearchChange !== undefined ? propOnSearchChange : setInternalSearchTerm;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (columnKey: keyof T) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const sortedData = useMemo(() => {
    const sortableData = [...data];

    if (sortColumn) {
      sortableData.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        // Fallback for other types or if values are not comparable
        return 0;
      });
    }
    return sortableData;
  }, [data, sortColumn, sortDirection]);

  const filteredData = useMemo(() => {
    // Si une prop de recherche est fournie, cela signifie que le filtrage est géré en amont.
    // Dans ce cas, nous retournons simplement les données triées.
    if (propSearchTerm !== undefined) {
      return sortedData;
    }

    // Sinon, nous utilisons la logique de filtrage interne par défaut.
    if (!currentSearchTerm) {
      return sortedData;
    }
    const lowercasedFilter = currentSearchTerm.toLowerCase();
    return sortedData.filter((item) =>
      Object.values(item).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(lowercasedFilter)
      )
    );
  }, [sortedData, currentSearchTerm, propSearchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>{title}</CardTitle>
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        <Input
          placeholder={searchPlaceholder}
          value={currentSearchTerm}
          onChange={(e) => {
            currentSetSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="mb-4"
        />
        {loading ? (
          <p className="text-gray-500">{loadingMessage}</p>
        ) : filteredData.length === 0 ? (
          <p className="text-gray-500">{emptyMessage}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key as string}
                      className={cn(
                        column.className,
                        column.sortable && "cursor-pointer hover:bg-gray-100"
                      )}
                      onClick={() =>
                        column.sortable && handleSort(column.key as keyof T)
                      }
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {sortColumn === column.key &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key as string}
                        className={column.className}
                      >
                        {column.render
                          ? column.render(item)
                          : (item[column.key as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir le menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Êtes-vous sûr de vouloir supprimer cet élément ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(item.id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminGenericTable;
