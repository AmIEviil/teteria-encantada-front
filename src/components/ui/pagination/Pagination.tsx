import ArrowIcon from "../Icons/ArrowIcon";
import "./Pagination.css";

interface PaginationProps {
  actualPage: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

const CustomPagination = ({
  actualPage = 1,
  totalPages = 1,
  disabled = false,
  onPageChange,
}: PaginationProps) => {
  const generatePageItems = () => {
    const items = [];

    // If we're on page 1, show: [1] [...] [last]
    if (actualPage === 1) {
      // Show current page (1)
      items.push(
        <button className="custom-pagination-item active" key={1} disabled>
          {1}
        </button>
      );

      // Show ellipsis and last page if there are more than 2 pages total
      if (totalPages > 2) {
        items.push(
          <span className="pagination-ellipsis" key="middle">
            ...
          </span>
        );
        items.push(
          <button
            className="custom-pagination-item"
            key={totalPages}
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </button>
        );
      }
    }
    // If we're on last page, show: [1] [...] [last]
    else if (actualPage === totalPages) {
      // Show first page
      items.push(
        <button
          className="custom-pagination-item"
          key={1}
          onClick={() => onPageChange(1)}
          disabled={disabled}
        >
          {1}
        </button>
      );

      // Show ellipsis and current page (last) if there are more than 2 pages total
      if (totalPages > 2) {
        items.push(
          <span className="pagination-ellipsis" key="middle">
            ...
          </span>
        );
      }

      items.push(
        <button
          className="custom-pagination-item active"
          key={totalPages}
          disabled
        >
          {totalPages}
        </button>
      );
    }
    // For all other pages, show adjacent pages
    else {
      // Show first page if we're not close to it
      if (actualPage > 3) {
        items.push(
          <button
            className="custom-pagination-item"
            key={1}
            onClick={() => onPageChange(1)}
            disabled={disabled}
          >
            {1}
          </button>
        );
        if (actualPage > 4) {
          items.push(
            <span className="pagination-ellipsis" key="start">
              ...
            </span>
          );
        }
      }

      // Show previous page
      if (actualPage > 1) {
        items.push(
          <button
            className="custom-pagination-item"
            key={actualPage - 1}
            onClick={() => onPageChange(actualPage - 1)}
            disabled={disabled}
          >
            {actualPage - 1}
          </button>
        );
      }

      // Current page
      items.push(
        <button
          className="custom-pagination-item active"
          key={actualPage}
          disabled
        >
          {actualPage}
        </button>
      );

      // Show next page
      if (actualPage < totalPages) {
        items.push(
          <button
            className="custom-pagination-item"
            key={actualPage + 1}
            onClick={() => onPageChange(actualPage + 1)}
            disabled={disabled}
          >
            {actualPage + 1}
          </button>
        );
      }

      // Show last page if we're not close to it
      if (actualPage < totalPages - 2) {
        if (actualPage < totalPages - 3) {
          items.push(
            <span className="pagination-ellipsis" key="end">
              ...
            </span>
          );
        }
        items.push(
          <button
            className="custom-pagination-item"
            key={totalPages}
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </button>
        );
      }
    }

    return items;
  };

  return (
    <div className="pagination-container">
      <button
        className="custom-pagination-item pagination-nav"
        disabled={actualPage === 1 || disabled}
        onClick={() => onPageChange(actualPage - 1)}
      >
        <ArrowIcon direction="left" />
      </button>
      {generatePageItems()}
      <button
        className="custom-pagination-item pagination-nav"
        disabled={actualPage === totalPages || disabled}
        onClick={() => onPageChange(actualPage + 1)}
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
};

export default CustomPagination;
