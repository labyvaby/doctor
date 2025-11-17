import React, { useContext } from "react";
import { Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import type { RefineThemedLayoutSiderProps } from "@refinedev/antd";
import {
  HomeOutlined,
  SearchOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  BlockOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutContext } from "../../contexts/layout";
import "./styles.css";

const { Sider } = Layout;

type NavLinkItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
};

type NavDivider = { key: string; type: "divider" };

const NAV_ITEMS: (NavLinkItem | NavDivider)[] = [
  { key: "home", label: "Главная", icon: <HomeOutlined />, path: "/" },
  { key: "search", label: "Поиск пациента", icon: <SearchOutlined />, path: "/search" },
  { key: "visits", label: "Приемы", icon: <ScheduleOutlined />, path: "/visits" },
  { key: "categories", label: "Категории", icon: <AppstoreOutlined />, path: "/categories" },
  { key: "costs", label: "Расходы", icon: <DollarCircleOutlined />, path: "/costs" },
  { key: "doctors", label: "Сотрудники", icon: <TeamOutlined />, path: "/doctors" },
  { key: "products", label: "Товары", icon: <ShoppingOutlined />, path: "/products" },
  { key: "sales", label: "Продажи товаров", icon: <ShoppingCartOutlined />, path: "/sales" },
  { key: "warehouse", label: "Склад", icon: <DatabaseOutlined />, path: "/warehouse" },
  { key: "blacklist", label: "Черный список", icon: <BlockOutlined />, path: "/blacklist" },
  { key: "diagnostics", label: "Анализы", icon: <ExperimentOutlined />, path: "/diagnostics" },
  { key: "divider-1", type: "divider" },
  { key: "about", label: "О нас", icon: <InfoCircleOutlined />, path: "/about" },
  { key: "apps", label: "App Gallery", icon: <AppstoreOutlined />, path: "/apps" },
];


type MenuItem = Required<MenuProps>["items"][number];

const toAntdMenuItems = (activeKey: string): MenuItem[] =>
  NAV_ITEMS.map((item) => {
    if ("type" in item) {
      return { type: "group", key: item.key, label: <div className="custom-menu-divider" /> } as MenuItem;
    }
    return {
      key: item.key,
      icon: item.icon,
      label: item.label,
      className: item.key === activeKey ? "is-active" : undefined,
    } as MenuItem;
  });

export const CustomSider: React.FC<RefineThemedLayoutSiderProps>
  = (props) => {
    void props;
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const location = useLocation();
    const { siderCollapsed } = useContext(LayoutContext);

    const pathname = location.pathname;
    let selectedKey = "home";
    const matched = NAV_ITEMS.find(
      (i): i is NavLinkItem => {
        if ("type" in i) return false;
        const p = i.path;
        if (!p) return false;
        return p === "/" ? pathname === "/" : pathname.startsWith(p);
      }
    );
    if (matched) selectedKey = matched.key;

    const onClick: MenuProps["onClick"] = ({ key }) => {
      const item = NAV_ITEMS.find((i): i is NavLinkItem => !("type" in i) && i.key === key);
      if (item?.path) {
        navigate(item.path);
      }
    };

    return (
      <Sider
        width={240}
        collapsedWidth={60}
        collapsed={siderCollapsed}
        className="custom-sider"
        theme="light"
        style={{ background: token.colorBgContainer }}
      >
        <div style={{ height: 8 }} />
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={onClick}
          items={toAntdMenuItems(selectedKey)}
          className="custom-menu"
        />
      </Sider>
    );
  };
