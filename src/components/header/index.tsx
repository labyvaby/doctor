import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Button,
  Input,
} from "antd";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { LayoutContext } from "../../contexts/layout";
import { MenuOutlined, SearchOutlined, HeartTwoTone } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

type HeaderProps = RefineThemedLayoutHeaderProps & {
  collapsed?: boolean;
  onToggle?: () => void;
};

export const Header: React.FC<HeaderProps> = ({ sticky = true, onToggle }) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const { toggleSider } = useContext(LayoutContext);
  const navigate = useNavigate();
  const location = useLocation();
  const q = new URLSearchParams(location.search).get("q") || "";

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 16px",
    height: 64,
    gap: 12,
  };

  if (sticky) {
    headerStyles.position = "fixed";
    headerStyles.left = 0;
    headerStyles.right = 0;
    headerStyles.top = 0;
    headerStyles.width = "100%";
    headerStyles.zIndex = 1000;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space size={12} align="center">
        <Button
          type="text"
          aria-label="Toggle menu"
          icon={<MenuOutlined />}
          onClick={onToggle ?? toggleSider}
          style={{ fontSize: 18 }}
        />
        <HeartTwoTone twoToneColor="#52c41a" style={{ fontSize: 22 }} />
        <Text strong style={{ fontSize: 18 }}>Мама Доктор</Text>
      </Space>

      {/* Center: search */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Input
          allowClear
          defaultValue={q}
          placeholder="Поиск пациента"
          prefix={<SearchOutlined />}
          onPressEnter={(e) => {
            const v = (e.target as HTMLInputElement).value.trim();
            navigate(`/search${v ? `?q=${encodeURIComponent(v)}` : ""}`);
          }}
          style={{ maxWidth: 800, background: token.colorFillTertiary }}
        />
      </div>

      {/* Right: theme + user */}
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <Space style={{ marginLeft: 8 }} size="middle">
          {user?.name && <Text strong>{user.name}</Text>}
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
