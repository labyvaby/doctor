import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  List,
  Typography,
  Button,
  Space,
  Avatar,
  Tag,
  theme,
  Divider,
  Drawer,
  Select,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  DollarCircleOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  ShoppingCartOutlined,
  FundOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

// Helpers
const formatCurrency = (num: number) => new Intl.NumberFormat("ru-RU").format(num);

const useTodayLabel = () => {
  return useMemo(() => {
    const d = new Date();
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);
};

// Mock data (procedures/sales/expenses still local). Appointments will be loaded from public/appointments.json
// UI shape for appointments list
type AppointmentUI = {
  time: string;
  name: string;
  note: string;
  price: number;
  done: boolean;
};

// Raw shape coming from appointments.json (fields are in RU)
export type AppointmentRaw = {
  [key: string]: unknown;
  "Дата и время"?: string;
  "Дата n8n"?: string;
  "Дата n8н"?: string; // occasionally data may contain this variant
  "Комментарий администратора"?: string;
  "Жалобы при обращении"?: string;
  "Стоимость"?: number | string;
  "Итого, сом"?: number | string;
  "Пациент ID"?: string;
  "Статус"?: string;
};

type FilterState = {
  doctor?: string;
  patient?: string;
  service?: string;
  year?: number;
  date?: string; // formatted DD.MM.YYYY
};

// Convert "15.11.2025 0:01:00" -> "00:01"
const formatTimeFromDateTime = (s: string): string => {
  const parts = s.split(" ");
  const timePart = parts[1] || "";
  const [h = "00", m = "00"] = timePart.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};


const procedures = [
  { title: "Укол внутримышечно — Дексаметазон 1 мл.", by: "Медсестра - Кайыргуль", price: 250 },
  { title: "Анализ (мазок из зева или носа) — Мультитест", by: "Медсестра - Кайыргуль", price: 800 },
  { title: "Капельница — Физраствор 100 мл.", by: "Медсестра - Бермет эже", price: 400 },
];

const sales = [
  { title: "Термометр (градусник)", qty: 1, price: 950 },
  { title: "Дексаметазон 1 мл.", qty: 1, price: 50 },
  { title: "Марля медицинская", qty: 1, price: 70 },
];

const expenses = [
  { date: "16.11.2025", list: [
    { title: "обед БС", who: "Реаниматолог - Бекамамат Суран Уулу", amount: 922 },
    { title: "мика обед", who: "Ресепшн - Мика", amount: 609 },
    { title: "Аванс", who: "Ресепшн - Мика", amount: 650 },
  ]},
  { date: "15.11.2025", list: [
    { title: "Аванс Еда", who: "Педиатр - Бурдайбекова Мэрзим Улановна", amount: 458 },
  ]},
];

const CardHeader: React.FC<{ title: React.ReactNode; extraRight?: React.ReactNode }>
  = ({ title, extraRight }) => {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>
        <Text strong style={{ fontSize: 16 }}>{title}</Text>
        <Space>
          <Button size="small" icon={<ReloadOutlined />} />
          <Button size="small" icon={<SettingOutlined />} />
          {extraRight}
        </Space>
      </div>
    );
  };

const Home: React.FC = () => {
  const todayLabel = useTodayLabel();
  const { token } = theme.useToken();

  const [appointments, setAppointments] = useState<AppointmentUI[]>([]);
  const [displayDateLabel, setDisplayDateLabel] = useState<string>(todayLabel);
  const [allRaw, setAllRaw] = useState<AppointmentRaw[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/appointments.json");
        const raw = (await res.json()) as unknown;
        const arr: AppointmentRaw[] = Array.isArray(raw) ? (raw as AppointmentRaw[]) : [];

        const normalize = (s: unknown) => (typeof s === "string" ? s.trim() : "");
        const parseDate = (s: string) => {
          const [dd, mm, yyyy] = (s || "").split(".");
          return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
        };

        let selectedDate = todayLabel;
        let selected: AppointmentRaw[] = arr.filter((x: AppointmentRaw) => normalize(x["Дата n8н"]) === todayLabel || normalize(x["Дата n8n"]) === todayLabel);

        if (selected.length === 0 && arr.length > 0) {
          const dates: string[] = Array.from(
            new Set(
              arr
                .map((x: AppointmentRaw) => (normalize(x["Дата n8н"]) || normalize(x["Дата n8n"])) as string)
                .filter(Boolean)
            )
          );
          dates.sort((a, b) => parseDate(b) - parseDate(a));
          selectedDate = dates[0];
          selected = arr.filter((x: AppointmentRaw) => normalize(x["Дата n8н"]) === selectedDate || normalize(x["Дата n8n"]) === selectedDate);
        }

        setAllRaw(arr);
        setDisplayDateLabel(selectedDate);
      } catch (e) {
        console.error("Failed to load appointments.json", e);
      }
    };
    load();
  }, [todayLabel]);

  // Unique options for filters
  const pickUnique = (getter: (x: AppointmentRaw) => string) => {
    const s = new Set<string>();
    allRaw.forEach((x) => {
      const v = getter(x).trim();
      if (v) s.add(v);
    });
    return Array.from(s).map((v) => ({ label: v, value: v }));
  };

  const doctorsOptions = useMemo(
    () => pickUnique((x) => String(x["Доктор ID"] || "")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRaw]
  );
  const patientsOptions = useMemo(
    () => pickUnique((x) => String(x["Пациент ID"] || "")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRaw]
  );
  const servicesOptions = useMemo(
    () => pickUnique((x) => String(x["Услуга ID"] || "")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRaw]
  );
  const yearsOptions = useMemo(() => {
    const s = new Set<number>();
    allRaw.forEach((x) => {
      const ds = String((x["Дата n8н"] as string) || (x["Дата n8n"] as string) || "");
      const y = Number((ds.split(".")[2]) || 0);
      if (y) s.add(y);
    });
    return Array.from(s)
      .sort((a, b) => b - a)
      .map((y) => ({ label: String(y), value: y }));
  }, [allRaw]);

  // Re-compute appointments list when filters change
  useEffect(() => {
    if (allRaw.length === 0) return;
    const dateForList = filters.date || displayDateLabel;

    const filtered = allRaw.filter((x) => {
      const dateStr = String((x["Дата n8н"] as string) || (x["Дата n8n"] as string) || "");
      const year = Number((dateStr.split(".")[2]) || 0);
      const matchDate = dateForList ? dateStr === dateForList : true;
      const matchYear = filters.year ? year === filters.year : true;
      const matchDoctor = filters.doctor ? String(x["Доктор ID"] || "") === filters.doctor : true;
      const matchPatient = filters.patient ? String(x["Пациент ID"] || "") === filters.patient : true;
      const matchService = filters.service ? String(x["Услуга ID"] || "") === filters.service : true;
      return matchDate && matchYear && matchDoctor && matchPatient && matchService;
    });

    const mapped: AppointmentUI[] = filtered
      .sort((a: AppointmentRaw, b: AppointmentRaw) => String(a["Дата и время"]).localeCompare(String(b["Дата и время"])) )
      .map((x: AppointmentRaw) => ({
        time: formatTimeFromDateTime(String(x["Дата и время"] || "")),
        name: String(x["Пациент ID"] || "—"),
        note: String((x["Комментарий администратора"] as string) || (x["Жалобы при обращении"] as string) || "").trim(),
        price: Number((x["Стоимость"] as number | string | undefined) ?? (x["Итого, сом"] as number | string | undefined) ?? 0),
        done: String(x["Статус"] || "").toLowerCase() === "оплачено",
      }));

    setAppointments(mapped);
  }, [filters, allRaw, displayDateLabel]);

  const appointmentsTitle =
    filters.date
      ? `Приемы на ${filters.date}`
      : displayDateLabel === todayLabel
        ? `Приемы сегодня (${todayLabel})`
        : `Приемы на ${displayDateLabel}`;

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ margin: "8px 0 16px" }}>Главная</Title>

      <Row gutter={[16, 16]}>
        {/* LEFT COLUMN: Appointments */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={
              <CardHeader
                title={
                  <span>{appointmentsTitle}</span>
                }
                extraRight={
                  <Space>
                    <Button size="small" icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>Фильтр</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />}>Приём</Button>
                  </Space>
                }
              />
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ maxHeight: 700, overflow: "auto" }}>
              <List
                itemLayout="vertical"
                dataSource={appointments}
                renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 12, paddingRight: 12 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Space>
                        {item.done ? (
                          <CheckCircleTwoTone twoToneColor="#52c41a" />
                        ) : (
                          <ClockCircleTwoTone twoToneColor={token.colorPrimary} />
                        )}
                        <Text strong>{item.time}</Text>
                        <Text>{item.name}</Text>
                      </Space>
                      <Tag color="blue">{formatCurrency(item.price)}</Tag>
                    </Space>
                    <Text type="secondary" style={{ marginLeft: 28, display: "block" }}>{item.note}</Text>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* MIDDLE COLUMN: Procedures */}
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={<CardHeader title={<span>Процедуры в этом месяце</span>} extraRight={<Button size="small" icon={<PlusOutlined />}>Создать</Button>} />}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ maxHeight: 700, overflow: "auto" }}>
              <List
                itemLayout="horizontal"
                dataSource={procedures}
                renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 12, paddingRight: 12 }}>
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: token.colorPrimaryBg }} icon={<FundOutlined style={{ color: token.colorPrimary }} />} />}
                      title={<Text>{item.title}</Text>}
                      description={<Text type="secondary">{item.by}</Text>}
                    />
                    <div style={{ minWidth: 56, textAlign: "right" }}>
                      <Text type="secondary">{formatCurrency(item.price)}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN: Sales + Expenses */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Card
              size="small"
              title={<CardHeader title={<span>Продажи</span>} extraRight={<Button size="small" icon={<PlusOutlined />}>Продажа</Button>} />}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{ maxHeight: 325, overflow: "auto" }}>
                <List
                  itemLayout="horizontal"
                  dataSource={sales}
                  renderItem={(item) => (
                    <List.Item style={{ paddingLeft: 12, paddingRight: 12 }}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ShoppingCartOutlined />} />}
                        title={<Text>{item.title}</Text>}
                        description={<Text type="secondary">{item.qty} шт.</Text>}
                      />
                      <Text type="secondary">{formatCurrency(item.price)}</Text>
                    </List.Item>
                  )}
                />
              </div>
            </Card>

            <Card
              size="small"
              title={<CardHeader title={<span>Расходы в этом месяце</span>} extraRight={<Button size="small" icon={<PlusOutlined />}>Расход</Button>} />}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {expenses.map((day) => (
                  <div key={day.date}>
                    <div style={{ padding: "8px 12px", color: token.colorTextTertiary }}>{day.date}</div>
                    <List
                      itemLayout="horizontal"
                      dataSource={day.list}
                      renderItem={(item) => (
                        <List.Item style={{ paddingLeft: 12, paddingRight: 12 }}>
                          <List.Item.Meta
                            avatar={<Avatar style={{ background: token.colorErrorBg }} icon={<DollarCircleOutlined style={{ color: token.colorError }} />} />}
                            title={<Text>{item.title}</Text>}
                            description={<Text type="secondary">{item.who}</Text>}
                          />
                          <Text type="secondary">{formatCurrency(item.amount)}</Text>
                        </List.Item>
                      )}
                    />
                    <Divider style={{ margin: 0 }} />
                  </div>
                ))}
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      <Drawer
        title="Фильтры"
        placement="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        width={400}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text type="secondary">Выбрать доктора</Text>
            <Select
              allowClear
              placeholder="Доктор ID"
              style={{ width: "100%", marginTop: 6 }}
              options={doctorsOptions}
              value={filters.doctor}
              onChange={(v) => setFilters((f) => ({ ...f, doctor: v }))}
            />
          </div>

          <div>
            <Text type="secondary">Выбрать пациента</Text>
            <Select
              allowClear
              placeholder="Пациент ID"
              style={{ width: "100%", marginTop: 6 }}
              options={patientsOptions}
              value={filters.patient}
              onChange={(v) => setFilters((f) => ({ ...f, patient: v }))}
            />
          </div>

          <div>
            <Text type="secondary">Выбрать услугу</Text>
            <Select
              allowClear
              placeholder="Услуга ID"
              style={{ width: "100%", marginTop: 6 }}
              options={servicesOptions}
              value={filters.service}
              onChange={(v) => setFilters((f) => ({ ...f, service: v }))}
            />
          </div>

          <div>
            <Text type="secondary">Год</Text>
            <Select
              allowClear
              placeholder="Год"
              style={{ width: "100%", marginTop: 6 }}
              options={yearsOptions}
              value={filters.year}
              onChange={(v) => setFilters((f) => ({ ...f, year: v }))}
            />
          </div>

          <div>
            <Text type="secondary">Дата</Text>
            <DatePicker
              format="DD.MM.YYYY"
              style={{ width: "100%", marginTop: 6 }}
              value={filters.date ? dayjs(filters.date, "DD.MM.YYYY") : undefined}
              onChange={(d: Dayjs | null) =>
                setFilters((f) => ({ ...f, date: d ? d.format("DD.MM.YYYY") : undefined }))
              }
            />
          </div>

          <Space>
            <Button onClick={() => setFilters({})}>Сбросить</Button>
            <Button type="primary" onClick={() => setFilterOpen(false)}>Готово</Button>
          </Space>
        </Space>
      </Drawer>
    </div>
  );
};

export default Home;
