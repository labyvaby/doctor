import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  List,
  Typography,
  Button,
  Space,
  Input,
  Tag,
  Avatar,
  theme,
  Divider,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  PhoneOutlined,
  EditOutlined,
  LikeTwoTone,
  ReloadOutlined,
  SettingOutlined,
  SearchOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  ArrowRightOutlined,
  FileTextOutlined,
  PrinterOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";

const { Text, Title } = Typography;

// -------------------
// Helpers
// -------------------
const formatCurrency = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
const formatDateTime = (s: string) => s || ""; // already DD.MM.YYYY HH:mm:ss in data
const formatTime = (s: string) => {
  const t = s.split(" ")[1] || "";
  const [h = "00", m = "00"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

// Create deterministic values from id
const seededNumber = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
};
const phoneFromId = (id: string) => {
  const s = String(seededNumber(id));
  return `996${s.slice(0, 9).padEnd(9, "0")}`;
};
const nameFromId = (id: string) => {
  const names = [
    "Акбаров",
    "Мамарасулов",
    "Кенжебеков",
    "Таалайбеков",
    "Сеиталиева",
    "Муразов",
    "Ниязбеков",
    "Канатбеков",
    "Рамизов",
    "Аскаров",
  ];
  const given = [
    "Айбек",
    "Айым",
    "Адилет",
    "Айдос",
    "Айдана",
    "Нурсултан",
    "Ариана",
    "Марсель",
    "Нурислам",
    "Сумая",
  ];
  const h = seededNumber(id);
  return `${pick(names, h)} ${pick(given, h >> 3)}`;
};

// -------------------
// Types
// -------------------
export type AppointmentRaw = {
  [key: string]: unknown;
  "ID"?: string;
  "Доктор ID"?: string;
  "Пациент ID"?: string;
  "Услуга ID"?: string;
  "Дата и время"?: string;
  "Статус"?: string;
  "Стоимость"?: number | string;
  "Комментарий администратора"?: string;
  "Жалобы при обращении"?: string;
  "Дата n8n"?: string;
  "Дата n8н"?: string;
};

type Patient = {
  id: string;
  name: string;
  phone: string;
  lastVisit?: string;
  visitsCount: number;
};

// -------------------
// Main component
// -------------------
const PatientsSearch: React.FC = () => {
  const { token } = theme.useToken();
  const loc = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(loc.search).get("q") || "";

  const [allRaw, setAllRaw] = useState<AppointmentRaw[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();
  const [filter, setFilter] = useState<string>(query);

  // Load all appointments once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/appointments.json");
        const arr = (await res.json()) as AppointmentRaw[];
        setAllRaw(Array.isArray(arr) ? arr : []);
      } catch (e) {
        console.error("Failed to load appointments.json", e);
      }
    };
    load();
  }, []);

  // Build patients map from appointments
  useEffect(() => {
    if (!allRaw.length) return;
    const map = new Map<string, Patient>();
    allRaw.forEach((a) => {
      const pid = String(a["Пациент ID"] || "");
      if (!pid) return;
      const dt = String(a["Дата и время"] || "");
      const ex = map.get(pid);
      if (!ex) {
        map.set(pid, {
          id: pid,
          name: nameFromId(pid),
          phone: phoneFromId(pid),
          lastVisit: dt,
          visitsCount: 1,
        });
      } else {
        ex.visitsCount += 1;
        // later date
        if (String(ex.lastVisit || "") < dt) ex.lastVisit = dt;
      }
    });

    const items = Array.from(map.values()).sort((a, b) => String(b.lastVisit).localeCompare(String(a.lastVisit)));
    setPatients(items);
    // auto-select first one
    if (items.length && !selectedPatientId) setSelectedPatientId(items[0].id);
  }, [allRaw]);

  // Keep search param in URL when user types Enter in local search
  const pushQuery = (q: string) => {
    const sp = new URLSearchParams(loc.search);
    if (q) sp.set("q", q); else sp.delete("q");
    navigate({ pathname: "/search", search: `?${sp.toString()}` });
  };

  useEffect(() => setFilter(query), [query]);

  const filteredPatients = useMemo(() => {
    if (!filter) return patients;
    const f = filter.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(f) || p.phone.includes(filter) || p.id.includes(filter));
  }, [patients, filter]);

  const historyForSelected = useMemo(() => {
    if (!selectedPatientId) return [] as AppointmentRaw[];
    return allRaw
      .filter((a) => String(a["Пациент ID"]) === selectedPatientId)
      .sort((a, b) => String(b["Дата и время"]).localeCompare(String(a["Дата и время"])));
  }, [allRaw, selectedPatientId]);

  const selectedAppointment = useMemo(
    () => historyForSelected.find((a) => String(a.ID) === selectedAppointmentId),
    [historyForSelected, selectedAppointmentId]
  );

  // ------------------- UI helpers -------------------
  const CardHeader: React.FC<{ title: React.ReactNode; extraRight?: React.ReactNode }> = ({ title, extraRight }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <Text strong style={{ fontSize: 16 }}>{title}</Text>
      <Space>
        <Button size="small" icon={<ReloadOutlined />} />
        <Button size="small" icon={<SettingOutlined />} />
        {extraRight}
      </Space>
    </div>
  );

  // ------------------- Actions -------------------
  const startExam = () => {
    if (!selectedAppointment) return message.warning("Выберите прием");
    message.success("Прием начат");
  };
  const updateDoc = () => message.info("Документ обновлен (демо)");
  const printDoc = () => {
    message.info("Открыто окно печати (демо)");
    window.print?.();
  };
  

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ margin: "8px 0 16px" }}>Поиск пациента</Title>
      <Row gutter={[16, 16]}>
        {/* LEFT: Patients list */}
        <Col xs={24} lg={6} xl={6}>
          <Card
            size="small"
            title={
              <CardHeader
                title={<span>Пациенты</span>}
                extraRight={<Button size="small" icon={<PlusOutlined />}>Добавить</Button>}
              />
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: 8 }}>
              <Input
                allowClear
                placeholder="Поиск по имени, телефону, ID"
                prefix={<SearchOutlined />}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onPressEnter={(e) => pushQuery((e.target as HTMLInputElement).value)}
              />
            </div>
            <div style={{ maxHeight: 680, overflow: "auto" }}>
              <List
                dataSource={filteredPatients}
                renderItem={(p) => (
                  <List.Item
                    style={{ paddingLeft: 12, paddingRight: 12, cursor: "pointer", background: selectedPatientId === p.id ? token.colorPrimaryBg : undefined }}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setSelectedAppointmentId(undefined);
                    }}
                  >
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Space>
                        <Avatar size="small" style={{ background: token.colorPrimaryBg }}><LikeTwoTone twoToneColor={token.colorPrimary} /></Avatar>
                        <div>
                          <Text strong>{p.name}</Text>
                          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>{p.phone}</div>
                        </div>
                      </Space>
                      <Space size={6}>
                        <Button size="small" type="text" icon={<PhoneOutlined />} onClick={(e) => { e.stopPropagation(); message.info(`Звонок ${p.phone}`); }} />
                        <Button size="small" type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); message.info("Редактор пациента (демо)"); }} />
                      </Space>
                    </Space>
                  </List.Item>
                )}
                locale={{ emptyText: <Empty description="Нет пациентов" /> }}
              />
            </div>
          </Card>
        </Col>

        {/* MIDDLE: History and details */}
        <Col xs={24} lg={10} xl={10}>
          <Card
            size="small"
            title={<CardHeader title={<span>История приемов</span>} extraRight={<Button size="small" icon={<PlusOutlined />}>Приём</Button>} />}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ maxHeight: 430, overflow: "auto" }}>
              <List
                itemLayout="vertical"
                dataSource={historyForSelected}
                renderItem={(a) => {
                  const done = String(a["Статус"] || "").toLowerCase() === "оплачено";
                  const price = Number((a["Стоимость"] as number | string | undefined) ?? 0);
                  return (
                    <List.Item
                      style={{ paddingLeft: 12, paddingRight: 12, cursor: "pointer", background: String(a.ID) === selectedAppointmentId ? token.colorPrimaryBg : undefined }}
                      onClick={() => setSelectedAppointmentId(String(a.ID))}
                    >
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                          {done ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <ClockCircleTwoTone twoToneColor={token.colorPrimary} />}
                          <Text strong>{formatTime(String(a["Дата и время"]))}</Text>
                          <Text>Доктор {String(a["Доктор ID"] || "—")}</Text>
                          <Text type="secondary">{String(a["Жалобы при обращении"] || a["Комментарий администратора"] || "")}</Text>
                        </Space>
                        <Tag color="blue">{formatCurrency(price)}</Tag>
                      </Space>
                    </List.Item>
                  );
                }}
                locale={{ emptyText: <Empty description="Нет приемов" /> }}
              />
            </div>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card size="small" title={<CardHeader title={<span>Подробнее о пациенте</span>} />}>
                {selectedPatientId ? (
                  <Space direction="vertical" size={6}>
                    <Text type="secondary">Имя</Text>
                    <Text>{patients.find((p) => p.id === selectedPatientId)?.name}</Text>
                    <Text type="secondary">Телефон</Text>
                    <Text>{patients.find((p) => p.id === selectedPatientId)?.phone}</Text>
                    <Text type="secondary">ID</Text>
                    <Text>{selectedPatientId}</Text>
                    <Text type="secondary">Последний визит</Text>
                    <Text>{patients.find((p) => p.id === selectedPatientId)?.lastVisit}</Text>
                  </Space>
                ) : (
                  <Empty description="Нет выбранных полей" />
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title={<CardHeader title={<span>Подробнее о приеме</span>} />}>
                {selectedAppointment ? (
                  <Space direction="vertical" size={6}>
                    <Text type="secondary">Дата и время</Text>
                    <Text>{formatDateTime(String(selectedAppointment["Дата и время"]))}</Text>
                    <Text type="secondary">Доктор</Text>
                    <Text>{String(selectedAppointment["Доктор ID"])}</Text>
                    <Text type="secondary">Статус</Text>
                    <Text>{String(selectedAppointment["Статус"])}</Text>
                    <Text type="secondary">Комментарий</Text>
                    <Text>{String(selectedAppointment["Комментарий администратора"] || selectedAppointment["Жалобы при обращении"] || "—")}</Text>
                  </Space>
                ) : (
                  <Empty description="Нет выбранных полей" />
                )}
              </Card>
            </Col>
          </Row>
        </Col>

        {/* RIGHT: Doctor view */}
        <Col xs={24} lg={8} xl={8}>
          <Card
            size="small"
            title={<CardHeader title={<span>Осмотр врача</span>} />}
            extra={<Button size="small" type="text" icon={<ArrowRightOutlined />} />}
          >
            {selectedAppointment ? (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Space size={24}>
                  <Button icon={<FileAddOutlined />} onClick={startExam}>Начать прием</Button>
                  <Button icon={<FileTextOutlined />} onClick={updateDoc}>Обновить документ</Button>
                  <Button icon={<PrinterOutlined />} onClick={printDoc}>Печать документа</Button>
                </Space>
                <Divider />
                <div>
                  <Text strong>Жалобы</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>
                    {String(selectedAppointment["Жалобы при обращении"] || "Нет данных")}
                  </div>
                </div>
                <div>
                  <Text strong>Диагноз</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>—</div>
                </div>
                <div>
                  <Text strong>Анамнез</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>
                    {String(selectedAppointment["Комментарий администратора"] || "—")}
                  </div>
                </div>
                <div>
                  <Text strong>Объективно</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>—</div>
                </div>
              </Space>
            ) : (
              <Empty description="Выберите прием" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientsSearch;
