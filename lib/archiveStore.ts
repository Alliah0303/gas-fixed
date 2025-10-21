// client/lib/archiveStore.ts
export type ArchiveRow = { id: string; date: string; time: string; value: number };

let _archive: ArchiveRow[] = [];

export function getArchive(): ArchiveRow[] {
  return _archive;
}

export function addToArchive(row: ArchiveRow) {
  _archive = [..._archive, row];
}

export function clearArchive() {
  _archive = [];
}
