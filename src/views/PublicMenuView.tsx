import { useMemo, useState } from "react";
import { PublicHeader } from "../components/public/PublicHeader";
import { usePublicMenuQuery } from "../core/api/public.hooks";
import "./PublicViews.css";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
};

export const PublicMenuView = () => {
  const [search, setSearch] = useState("");
  const { data: menuItems = [], isLoading } = usePublicMenuQuery();

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      const haystack = `${item.code} ${item.name} ${item.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [menuItems, search]);

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <section className="publicPanel">
          <h2>Carta de productos</h2>
          <p className="publicMuted">
            Explora los productos disponibles actualmente en Teteria Encantada.
          </p>

          <div className="publicMenuToolbar">
            <input
              className="publicField"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, codigo o descripcion"
              aria-label="Buscar productos en la carta"
            />

            <p className="publicMuted">{filteredItems.length} productos</p>
          </div>

          {isLoading ? <p className="publicMuted">Cargando carta...</p> : null}

          {!isLoading && filteredItems.length === 0 ? (
            <p className="publicMuted">No hay productos para el filtro seleccionado.</p>
          ) : null}

          <div className="publicMenuGrid">
            {filteredItems.map((item) => (
              <article className="publicMenuCard" key={item.id}>
                <p className="publicMenuCode">{item.code}</p>
                <h3 className="publicMenuName">{item.name}</h3>
                <p className="publicMenuDescription">{item.description || "Sin descripcion"}</p>
                <p className="publicMenuPrice">{formatCurrency(item.price)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
