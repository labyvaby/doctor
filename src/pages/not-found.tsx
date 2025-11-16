import React from "react";
import { Result, Button, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, FrownOutlined } from "@ant-design/icons";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <div style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: token.colorBgLayout,
    }}>
      <Result
        icon={<FrownOutlined style={{ color: token.colorPrimary, fontSize: 56 }} />}
        status="404"
        title={<Typography.Title level={3} style={{ marginTop: 8 }}>Страница не найдена</Typography.Title>}
        subTitle={<Typography.Paragraph type="secondary">Похоже, раздел ещё не реализован или адрес введён неверно.</Typography.Paragraph>}
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate("/")}>На главную</Button>
        }
      />
    </div>
  );
};
