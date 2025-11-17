import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  List,
  Typography,
  Button,
  Space,
  Tag,
  theme,
  Divider,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  ArrowRightOutlined,
  FileTextOutlined,
  PrinterOutlined,
  FileAddOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

// Types
export type AppointmentRaw = {
  [key: string]: unknown;
  ID?: string;
  "Доктор ID"?: string;
  "Пациент ID"?: string;
  "Услуга ID"?: string;
  "Заключение ID"?: string;
  "Дата и время"?: string;
  "Статус"?: string;
  "Стоимость"?: number | string;
  "Итого, сом"?: number | string;
  "Наличные"?: number | string;
  "Безналичные"?: number | string;
  "Дата n8n"?: string;
  "Дата n8н"?: string;
  "Комментарий администратора"?: string;
  "Жалобы при обращении"?: string;
};

// Helpers
const formatCurrency = (num: number) => new Intl.NumberFormat("ru-RU").format(num);
const formatTime = (s: string) => {
  const t = (s || "").split(" ")[1] || "";
  const [h = "00", m = "00"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};
const todayLabel = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

// Generate readable names from IDs (demo only)
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const seeded = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const doctorNameFromId = (id: string) => {
  const spec = ["Педиатр", "Невролог", "Уролог", "ЛОР", "Хирург", "Окулист"]; 
  const docs = [
    "Кулушова Аднай Канаат",
    "Аббасова Айгерим Аббасовна",
    "Сатытабекова Айдана Са",
    "Князев Игорь Алексеевич",
    "Бурдайбекова Мэрзим Улановна",
    "Абдразаков Рамизан",
  ];
  const h = seeded(id);
  return `${pick(spec, h)} - ${pick(docs, h >> 3)}`;
};
const patientNameFromId = (id: string) => {
  const last = ["Бахтияров", "Тааалайбеков", "Аскаров", "Ниязбеков", "Канатбеков", "Энгель" ];
  const first = ["Алихан", "Осмон", "Атай", "Марсель", "София", "Ариана"]; 
  const h = seeded(id);
  return `${pick(last, h)} ${pick(first, h >> 4)}`;
};

// UI types
type VisitItem = {
  id: string;
  time: string;
  patientName: string;
  price: number;
  done: boolean;
  raw: AppointmentRaw;
};

type DoctorGroup = {
  doctorId: string;
  doctorName: string;
  items: VisitItem[];
};

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

const VisitsPage: React.FC = () => {
  const { token } = theme.useToken();

  const [allRaw, setAllRaw] = useState<AppointmentRaw[]>([]);
  const [dateLabel, setDateLabel] = useState<string>(todayLabel());
  const [groups, setGroups] = useState<DoctorGroup[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();

  // Load appointments
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

  // Build groups for today (or closest date if none)
  useEffect(() => {
    if (!allRaw.length) return;

    const normalize = (x: AppointmentRaw) => String((x["Дата n8н"] as string) || (x["Дата n8n"] as string) || "").trim();
    const todays = allRaw.filter((x) => normalize(x) === dateLabel);

    let selectedDate = dateLabel;
    if (todays.length === 0) {
      const dates = Array.from(new Set(allRaw.map(normalize).filter(Boolean)));
      const parse = (s: string) => {
        const [dd, mm, yy] = s.split(".").map(Number);
        return new Date(yy, (mm || 1) - 1, dd || 1).getTime();
      };
      dates.sort((a, b) => parse(b) - parse(a));
      selectedDate = dates[0];
    }

    const todays2 = allRaw.filter((x) => normalize(x) === selectedDate);

    const byDoctor = new Map<string, VisitItem[]>();
    todays2
      .sort((a, b) => String(a["Дата и время"]).localeCompare(String(b["Дата и время"])))
      .forEach((a) => {
        const dId = String(a["Доктор ID"] || "");
        const list = byDoctor.get(dId) ?? [];
        list.push({
          id: String(a.ID || ""),
          time: formatTime(String(a["Дата и время"])) ,
          patientName: patientNameFromId(String(a["Пациент ID"] || "")),
          price: Number((a["Стоимость"] as number | string | undefined) ?? (a["Итого, сом"] as number | string | undefined) ?? 0),
          done: String(a["Статус"] || "").toLowerCase() === "оплачено",
          raw: a,
        });
        byDoctor.set(dId, list);
      });

    const result: DoctorGroup[] = Array.from(byDoctor.entries()).map(([doctorId, items]) => ({
      doctorId,
      doctorName: doctorNameFromId(doctorId),
      items,
    }));

    setGroups(result);
    setDateLabel(selectedDate);
    if (result.length && result[0].items.length) {
      setSelectedAppointmentId(result[0].items[0].id);
    }
  }, [allRaw]);

  const selectedAppointment = useMemo(() => {
    for (const g of groups) {
      const it = g.items.find((i) => i.id === selectedAppointmentId);
      if (it) return it.raw;
    }
    return undefined;
  }, [groups, selectedAppointmentId]);

  const sectionTitle = `Приемы сегодня (${dateLabel})`;

  // Actions
  const startExam = () => {
    if (!selectedAppointment) return message.warning("Выберите прием");
    message.success("Прием начат");
  };
  const updateDoc = () => message.info("Документ обновлен (демо)");
  const printDoc = () => { message.info("Открыто окно печати (демо)"); window.print?.(); };

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ margin: "8px 0 16px" }}>Приемы для врачей</Title>
      <Row gutter={[16, 16]}>
        {/* LEFT: Today appointments (grouped by doctor) */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={<CardHeader title={<span>{sectionTitle}</span>} extraRight={<Button size="small" icon={<PlusOutlined />}>Приём</Button>} />}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ maxHeight: 700, overflow: "auto" }}>
              {groups.length === 0 && <Empty description="Нет записей" style={{ margin: 16 }} />}
              {groups.map((g) => (
                <div key={g.doctorId}>
                  <div style={{ padding: "8px 12px", color: token.colorTextTertiary }}>{g.doctorName}</div>
                  <List
                    dataSource={g.items}
                    renderItem={(it) => (
                      <List.Item
                        style={{ paddingLeft: 12, paddingRight: 12, cursor: "pointer", background: it.id === selectedAppointmentId ? token.colorPrimaryBg : undefined }}
                        onClick={() => setSelectedAppointmentId(it.id)}
                      >
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Space>
                            {it.done ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <ClockCircleTwoTone twoToneColor={token.colorPrimary} />}
                            <Text strong>{it.time}</Text>
                            <Text>{it.patientName}</Text>
                          </Space>
                          <Tag color="blue">{formatCurrency(it.price)}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* MIDDLE: Appointment details */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={<CardHeader title={<span>Подробнее о приеме</span>} extraRight={<>
              <Button size="small" icon={<FilterOutlined />} />
              <Button size="small" icon={<ReloadOutlined />} />
            </>} />}
            bodyStyle={{ paddingTop: 0 }}
          >
            {selectedAppointment ? (
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Title level={5} style={{ margin: "8px 0" }}>
                    {String(selectedAppointment["Дата и время"]).split(" ")[0]} {formatTime(String(selectedAppointment["Дата и время"]))}
                  </Title>
                </div>
                <Text type="secondary">
                  {patientNameFromId(String(selectedAppointment["Пациент ID"]))} - {String(selectedAppointment["Пациент ID"]) }
                </Text>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text type="secondary">Выберите доктора</Text>
                  <div>{doctorNameFromId(String(selectedAppointment["Доктор ID"]))}</div>
                </div>
                <div>
                  <Text type="secondary">Выберите услугу</Text>
                  <div>Услуга {String(selectedAppointment["Услуга ID"])}</div>
                </div>
                <div>
                  <Text type="secondary">Итого, сом</Text>
                  <div>
                    <Tag color="green">{formatCurrency(Number((selectedAppointment["Стоимость"] as number | string | undefined) ?? (selectedAppointment["Итого, сом"] as number | string | undefined) ?? 0))}</Tag>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <Text type="secondary">Наличные</Text>
                    <div>{formatCurrency(Number(selectedAppointment["Наличные"] || 0))}</div>
                  </div>
                  <div>
                    <Text type="secondary">Безналичные</Text>
                    <div>{formatCurrency(Number(selectedAppointment["Безналичные"] || 0))}</div>
                  </div>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <div>
                  <Text strong>Выписанное заключение по данному приему</Text>
                  <div style={{ padding: 12, background: token.colorFillTertiary, marginTop: 8 }}>
                    Типичный вариант развития. <Button type="link">Расширить</Button>
                  </div>
                </div>
              </Space>
            ) : (
              <Empty description="Нет выбранного приема" />
            )}
          </Card>
        </Col>

        {/* RIGHT: Doctor view */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={<CardHeader title={<span>Осмотр врача</span>} />}
            extra={<Button size="small" type="text" icon={<ArrowRightOutlined />} />}
          >
            {selectedAppointment ? (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Space size={5}>
                  <Button icon={<FileAddOutlined />} onClick={startExam}>Начать прием</Button>
                  <Button icon={<FileTextOutlined />} onClick={updateDoc}>Обновить документ</Button>
                  <Button icon={<PrinterOutlined />} onClick={printDoc}>Печать документа</Button>
                </Space>
                <Divider />
                <div>
                  <Text strong>Жалобы</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>
                    {String(selectedAppointment["Жалобы при обращении"] || "нет.")}
                  </div>
                </div>
                <div>
                  <Text strong>Диагноз</Text>
                  <div style={{ color: token.colorTextSecondary, marginTop: 6 }}>Типичный вариант развития.</div>
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

export default VisitsPage;
