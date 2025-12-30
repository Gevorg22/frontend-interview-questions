import { useState, useMemo } from 'react';
import { Layout, Menu, Typography, Card, Collapse, theme, Drawer, Button, Checkbox, Progress, Space, Statistic, Row, Col, ConfigProvider, Switch, Breadcrumb, Input, Segmented } from 'antd';
import { BookOutlined, CodeOutlined, MenuOutlined, UnorderedListOutlined, CheckCircleOutlined, ClockCircleOutlined, BulbOutlined, BulbFilled, LeftOutlined, RightOutlined, ThunderboltOutlined, SearchOutlined, HomeOutlined } from '@ant-design/icons';
import questionsData from './data/questions.json';
import type { CategoryData, Topic } from './types';
import { useProgress } from './hooks/useProgress';
import { useTheme } from './hooks/useTheme';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const data: CategoryData = questionsData as CategoryData;

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('JavaScript');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [topicDrawerOpen, setTopicDrawerOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleQuestion, isCompleted, getStats } = useProgress();
  const { theme: appTheme, toggleTheme } = useTheme();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const createQuestionId = (category: string, topicTitle: string, questionIndex: number): string => {
    return `${category}__${topicTitle}__${questionIndex}`;
  };

  const sortedQuestions = useMemo(() => {
    if (!selectedTopic) {
      return [];
    }

    let questionsWithIds = selectedTopic.questions.map((question, index) => ({
      question,
      index,
      id: createQuestionId(selectedCategory, selectedTopic.title, index),
      completed: isCompleted(createQuestionId(selectedCategory, selectedTopic.title, index)),
    }));

    if (filterMode === 'completed') {
      questionsWithIds = questionsWithIds.filter(q => q.completed);
    } else if (filterMode === 'uncompleted') {
      questionsWithIds = questionsWithIds.filter(q => !q.completed);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      questionsWithIds = questionsWithIds.filter(q => 
        q.question.toLowerCase().includes(query)
      );
    }

    return questionsWithIds.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.index - b.index;
      } else {
        return a.completed ? 1 : -1;
      }
    });
  }, [selectedTopic, selectedCategory, isCompleted, filterMode, searchQuery]);

  const topicStats = useMemo(() => {
    if (!selectedTopic) {
      return { completed: 0, remaining: 0, percentage: 0 };
    }

    const questionIds = selectedTopic.questions.map((_, index) =>
      createQuestionId(selectedCategory, selectedTopic.title, index)
    );

    return getStats(selectedTopic.totalQuestions, questionIds);
  }, [selectedTopic, selectedCategory, getStats]);

  const totalStats = useMemo(() => {
    const allQuestionIds: string[] = [];
    let totalCount = 0;

    Object.entries(data).forEach(([category, topics]) => {
      topics.forEach((topic) => {
        totalCount += topic.totalQuestions;
        topic.questions.forEach((_, index) => {
          allQuestionIds.push(createQuestionId(category, topic.title, index));
        });
      });
    });

    return getStats(totalCount, allQuestionIds);
  }, [getStats]);

  const categoryMenuItems = Object.keys(data).map((category) => ({
    key: category,
    icon: <CodeOutlined />,
    label: `${category} (${data[category].reduce((acc, topic) => acc + topic.totalQuestions, 0)})`,
  }));

  const topicMenuItems = selectedCategory
    ? data[selectedCategory].map((topic, index) => {
        const topicQuestionIds = topic.questions.map((_, qIndex) =>
          createQuestionId(selectedCategory, topic.title, qIndex)
        );
        const completedCount = topicQuestionIds.filter(id => isCompleted(id)).length;
        const isTopicCompleted = completedCount === topic.totalQuestions;

        return {
          key: `${selectedCategory}-${index}`,
          icon: isTopicCompleted ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <BookOutlined />,
          label: `${topic.title} (${completedCount}/${topic.totalQuestions})`,
          onClick: () => {
            setSelectedTopic(topic);
            setActiveQuestionIndex(null);
          },
        };
      })
    : [];

  const selectRandomQuestion = () => {
    const allTopics: Array<{ category: string; topic: Topic }> = [];
    Object.entries(data).forEach(([category, topics]) => {
      topics.forEach(topic => {
        allTopics.push({ category, topic });
      });
    });

    if (allTopics.length === 0) {
      return;
    }

    const randomTopicData = allTopics[Math.floor(Math.random() * allTopics.length)];
    const randomQuestionIndex = Math.floor(Math.random() * randomTopicData.topic.questions.length);

    setSelectedCategory(randomTopicData.category);
    setSelectedTopic(randomTopicData.topic);
    setActiveQuestionIndex(randomQuestionIndex);
  };

  const goToNextQuestion = () => {
    if (activeQuestionIndex === null || activeQuestionIndex >= sortedQuestions.length - 1) {
      setActiveQuestionIndex(null);
    } else {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIndex === null || activeQuestionIndex <= 0) {
      setActiveQuestionIndex(null);
    } else {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <Title 
            level={3} 
            style={{ color: 'white', margin: 0, fontSize: 'clamp(16px, 4vw, 20px)', cursor: 'pointer' }}
            onClick={() => {
              setSelectedCategory('JavaScript');
              setSelectedTopic(null);
            }}
          >
            Frontend Interview Questions
          </Title>
          <Space size="small">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={selectRandomQuestion}
              style={{ color: 'white' }}
              className="desktop-only"
            >
              Случайный
            </Button>
            <div className="theme-switch">
              <Switch
                checked={appTheme === 'dark'}
                onChange={toggleTheme}
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
              />
            </div>
            <div className="mobile-menu-buttons">
              <Button
                type="text"
                icon={<ThunderboltOutlined />}
                onClick={selectRandomQuestion}
                style={{ color: 'white' }}
                className="mobile-only"
              />
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setCategoryDrawerOpen(true)}
                style={{ color: 'white', marginRight: 8 }}
              />
              <Button
                type="text"
                icon={<UnorderedListOutlined />}
                onClick={() => setTopicDrawerOpen(true)}
                style={{ color: 'white' }}
              />
            </div>
          </Space>
        </Header>
        <Layout>
        <Sider width={250} className="desktop-sider" style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedCategory]}
            style={{ height: '100%', borderRight: 0 }}
            items={categoryMenuItems}
            onClick={({ key }) => {
              setSelectedCategory(key);
              setSelectedTopic(null);
            }}
          />
        </Sider>
        <Sider width={300} className="desktop-sider" style={{ background: appTheme === 'dark' ? 'rgb(30, 30, 30)' : colorBgContainer, borderLeft: appTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #f0f0f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: appTheme === 'dark' ? 'inset 0 0 10px rgba(0, 0, 0, 0.3)' : undefined }}>
          <div style={{ padding: '16px', flexShrink: 0, borderBottom: appTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>
            <Title level={5}>{selectedCategory}</Title>
            <Text type="secondary">Выберите тему:</Text>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Menu
              mode="inline"
              selectedKeys={selectedTopic ? [`${selectedCategory}-${data[selectedCategory].indexOf(selectedTopic)}`] : []}
              style={{ borderRight: 0, background: 'transparent' }}
              items={topicMenuItems}
            />
          </div>
        </Sider>

        <Drawer
          title="Категории"
          placement="left"
          onClose={() => setCategoryDrawerOpen(false)}
          open={categoryDrawerOpen}
          width={280}
          styles={{
            header: {
              borderRadius: '0 16px 0 0'
            },
            body: {
              borderRadius: '0 0 16px 0',
              overflow: 'hidden'
            },
            wrapper: {
              borderRadius: '0 16px 16px 0',
              overflow: 'hidden'
            }
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedCategory]}
            style={{ borderRight: 0, borderRadius: '0 0 16px 0' }}
            items={categoryMenuItems}
            onClick={({ key }) => {
              setSelectedCategory(key);
              setSelectedTopic(null);
              setCategoryDrawerOpen(false);
            }}
          />
        </Drawer>

        <Drawer
          title={selectedCategory}
          placement="right"
          onClose={() => setTopicDrawerOpen(false)}
          open={topicDrawerOpen}
          width={280}
          styles={{
            header: {
              borderRadius: '16px 0 0 0'
            },
            body: {
              borderRadius: '0 0 0 16px',
              overflow: 'hidden'
            },
            wrapper: {
              borderRadius: '16px 0 0 16px',
              overflow: 'hidden'
            }
          }}
        >
          <Text style={{ display: 'block', marginBottom: 16 }}>Выберите тему:</Text>
          <Menu
            mode="inline"
            selectedKeys={selectedTopic ? [`${selectedCategory}-${data[selectedCategory].indexOf(selectedTopic)}`] : []}
            items={topicMenuItems}
            onClick={() => setTopicDrawerOpen(false)}
            style={{ borderRight: 0, borderRadius: '0 0 0 16px' }}
          />
        </Drawer>

        <Layout style={{ padding: '16px' }}>
          <Content
            style={{
              padding: 16,
              margin: 0,
              minHeight: 280,
              background: appTheme === 'dark' ? 'rgb(45, 45, 45)' : colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {selectedTopic ? (
              <>
                <Breadcrumb
                  style={{ marginBottom: 16 }}
                  items={[
                    {
                      href: '#',
                      title: <HomeOutlined />,
                      onClick: (e) => {
                        e.preventDefault();
                        setSelectedTopic(null);
                        setSelectedCategory('JavaScript');
                      },
                    },
                    {
                      href: '#',
                      title: selectedCategory,
                      onClick: (e) => {
                        e.preventDefault();
                        setSelectedTopic(null);
                      },
                    },
                    {
                      title: selectedTopic.title,
                    },
                  ]}
                />

                <Title level={2}>{selectedTopic.title}</Title>
                
                <Card style={{ marginBottom: 24, background: appTheme === 'dark' ? 'rgba(24, 144, 255, 0.08)' : '#f0f7ff', border: appTheme === 'dark' ? '1px solid rgba(24, 144, 255, 0.2)' : undefined }}>
                  <Text strong>Что хотят услышать интервьюеры:</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{selectedTopic.intro}</Paragraph>
                </Card>

                <Card style={{ marginBottom: 24, background: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : undefined, border: appTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : undefined }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Изучено"
                        value={topicStats.completed}
                        suffix={`/ ${selectedTopic.totalQuestions}`}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Осталось"
                        value={topicStats.remaining}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Прогресс</Text>
                        <Progress percent={topicStats.percentage} status="active" />
                      </Space>
                    </Col>
                  </Row>
                </Card>

                <Card style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Input
                      placeholder="Поиск по вопросам..."
                      prefix={<SearchOutlined />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      allowClear
                    />
                    <Segmented
                      options={[
                        { label: 'Все', value: 'all' },
                        { label: 'Изученные', value: 'completed' },
                        { label: 'Неизученные', value: 'uncompleted' },
                      ]}
                      value={filterMode}
                      onChange={(value) => setFilterMode(value as 'all' | 'completed' | 'uncompleted')}
                      block
                    />
                  </Space>
                </Card>

                {activeQuestionIndex !== null && (
                  <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                    <Button
                      icon={<LeftOutlined />}
                      onClick={goToPrevQuestion}
                      disabled={activeQuestionIndex === 0}
                    >
                      Предыдущий
                    </Button>
                    <Text>
                      Вопрос {activeQuestionIndex + 1} из {sortedQuestions.length}
                    </Text>
                    <Button
                      onClick={goToNextQuestion}
                      disabled={activeQuestionIndex >= sortedQuestions.length - 1}
                    >
                      Следующий <RightOutlined />
                    </Button>
                  </Space>
                )}

                <Collapse 
                  accordion
                  activeKey={activeQuestionIndex !== null ? [sortedQuestions[activeQuestionIndex]?.id] : undefined}
                  onChange={(key) => {
                    if (key && key.length > 0) {
                      const index = sortedQuestions.findIndex(q => q.id === key[0]);
                      setActiveQuestionIndex(index >= 0 ? index : null);
                    } else {
                      setActiveQuestionIndex(null);
                    }
                  }}
                >
                  {sortedQuestions.map(({ question, index, id, completed }) => {
                    const lines = question.split('\n');
                    const title = lines[0];
                    const content = lines.slice(1).join('\n');

                    return (
                      <Panel
                        header={
                          <Space>
                            <Checkbox
                              checked={completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleQuestion(id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span style={{ textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.6 : 1 }}>
                              {index + 1}. {title}
                            </span>
                          </Space>
                        }
                        key={id}
                      >
                        <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                      </Panel>
                    );
                  })}
                </Collapse>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 'clamp(40px, 10vh, 100px) 20px' }}>
                <BookOutlined style={{ fontSize: 'clamp(48px, 10vw, 64px)', color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Выберите категорию и тему</Title>
                <Paragraph type="secondary">
                  Всего доступно {Object.keys(data).length} категорий с{' '}
                  {Object.values(data).reduce((acc, topics) => acc + topics.reduce((sum, t) => sum + t.totalQuestions, 0), 0)}{' '}
                  вопросами
                </Paragraph>

                <Card style={{ marginTop: 32, maxWidth: 600, margin: '32px auto', background: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : undefined, border: appTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : undefined }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Statistic
                        title="Изучено вопросов"
                        value={totalStats.completed}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic
                        title="Осталось изучить"
                        value={totalStats.remaining}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={24}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Общий прогресс</Text>
                        <Progress percent={totalStats.percentage} status="active" strokeColor="#52c41a" />
                      </Space>
                    </Col>
                  </Row>
                </Card>

                <div className="mobile-hint" style={{ marginTop: 24 }}>
                  <Button 
                    type="primary" 
                    icon={<MenuOutlined />} 
                    onClick={() => setCategoryDrawerOpen(true)}
                    style={{ marginRight: 8 }}
                  >
                    Категории
                  </Button>
                  <Button 
                    icon={<UnorderedListOutlined />} 
                    onClick={() => setTopicDrawerOpen(true)}
                  >
                    Темы
                  </Button>
                </div>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
