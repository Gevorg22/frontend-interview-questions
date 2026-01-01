import { Sandpack } from '@codesandbox/sandpack-react';
import { Card } from 'antd';

interface CodePlaygroundProps {
  theme: 'light' | 'dark';
}

export const CodePlayground = ({ theme }: CodePlaygroundProps) => {
  return (
    <Card 
      title="Песочница для кода" 
      style={{ height: 'calc(100vh - 180px)' }}
      bodyStyle={{ height: 'calc(100% - 57px)', padding: 0 }}
    >
      <Sandpack
        theme={theme === 'dark' ? 'dark' : 'light'}
        template="react"
        options={{
          showNavigator: true,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: 'calc(100vh - 240px)',
          editorWidthPercentage: 60,
        }}
        files={{
          '/App.js': {
            code: `export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>👋 Привет!</h1>
      <p>Это песочница для экспериментов с кодом.</p>
      <p>Пишите код слева, результат справа.</p>
    </div>
  );
}`,
          },
        }}
      />
    </Card>
  );
};
