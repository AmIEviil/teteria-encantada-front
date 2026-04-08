import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TocIcon from "@mui/icons-material/Toc";
import HomeIcon from "@mui/icons-material/Home";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { topbarOptions } from "../../constant/routes";
import { useLocation, useNavigate } from "react-router";

export default function CustomNavBar() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const actualRoute = location.pathname.replace("/", "") || "Inicio";

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "home":
        return <HomeIcon />;
      case "clients":
        return <PeopleOutlineIcon />;
      case "inventory":
        return <InventoryIcon />;
      case "sales":
        return <AssessmentIcon />;
      case "reservations":
        return <EventSeatIcon />;
      case "events":
        return <EventNoteIcon />;
      default:
        return null;
    }
  };

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {topbarOptions.map((route) => (
          <ListItem
            disablePadding
            key={route.name}
            className={
              actualRoute.toLowerCase() === route.name.toLowerCase()
                ? "bg-blue-300! border-t border-b border-blue-500"
                : ""
            }
          >
            <ListItemButton onClick={() => navigate(route.path)}>
              {route.icon && (
                <ListItemIcon>{renderIcon(route.icon)}</ListItemIcon>
              )}
              <ListItemText primary={route.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );

  return (
    <div>
      <Button onClick={toggleDrawer(true)}>
        <span
          style={{
            display: "inline-flex",
            gap: "1rem",
            textTransform: "capitalize",
          }}
        >
          {actualRoute}
          <TocIcon />
        </span>
      </Button>
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>
    </div>
  );
}
