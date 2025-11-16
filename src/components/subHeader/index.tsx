import React from "react";
import { Button, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";

export const SubHeader: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
    return (
    <div
      style={{
        backgroundColor: token.colorBgElevated,
        padding: "16px",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        }}
    >
        <Typography.Title level={4} style={{ margin: 0 }}>
            SubHeader Title
        </Typography.Title>
        <Button type="primary" onClick={() => navigate(-1)}>
            Go Back
        </Button>
    </div>
  );
}