interface GenreChipProps {
  genre: string;
}

export function GenreChip({ genre }: GenreChipProps) {
  return (
    <li className="cursor-default rounded-control bg-primary-light-1 px-2 py-0.75 text-xs/[normal] text-gray-light-2">
      {genre}
    </li>
  );
}
