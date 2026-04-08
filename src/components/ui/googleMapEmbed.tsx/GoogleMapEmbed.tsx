import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Asegúrate de importar tus iconos correctamente
import WazeIcon from "../Icons/WazeIcon";
import GoogleMapsIcon from "../Icons/GoogleMapsIcon";

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  height?: string;
  width?: string;
  coordenadas?: { lat: number; lng: number };
  googleUrlLink?: string;
}

const MapFromCoords = ({
  lat,
  lng,
  zoom = 16,
  height = "450px",
  width = "100%",
  coordenadas,
  googleUrlLink,
}: Props) => {
  const isCoordsValid = lat !== 0 && lng !== 0;

  if (!isCoordsValid) {
    return (
      <div
        style={{
          height,
          width,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f2f2f2",
          borderRadius: "8px",
        }}
      >
        <p style={{ color: "#888" }}>Cargando mapa...</p>
      </div>
    );
  }

  const redirectItems = [
    {
      name: "Google Maps",
      // Corregí un pequeño error de tipeo potencial en la URL original
      url: `https://www.google.com/maps/search/?api=1&query=${coordenadas?.lat},${coordenadas?.lng}`,
      icon: <GoogleMapsIcon size={32} className="" />,
    },
    {
      name: "Waze",
      url: `https://waze.com/ul?ll=${coordenadas?.lat},${coordenadas?.lng}&navigate=yes`,
      icon: <WazeIcon size={32} />,
    },
  ];

  return (
    <div>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{
          height,
          width,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f2f2f2",
          borderRadius: "8px",
        }}
      >
        {/* CAPA 1: Base Satelital (La que ya tenías) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />

        <Marker position={[lat, lng]}>
          <Popup>Ubicación del cliente</Popup>
        </Marker>
      </MapContainer>

      {googleUrlLink && (
        <span className="flex justify-between mt-2 gap-4">
          {redirectItems.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
              style={{
                color: "#1976d2",
                textDecoration: "underline",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {item.icon}
              {item.name}
            </a>
          ))}
        </span>
      )}
    </div>
  );
};

export default MapFromCoords;
