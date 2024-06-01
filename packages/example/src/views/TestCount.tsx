import { useTestStore } from '@/views/test.ts'
import { Button, Card, Input, Space } from 'antd'

const TestCount = () => {
  const test = useTestStore()

  return (
    <Card title="plus">
      <Space>
        <Space>
          <Button onClick={() => test.add()}>+1</Button>
          <Button onClick={() => test.ranWo()}>ranWo</Button>
          <Button onClick={() => test.waitTime()}>waitTime</Button>
        </Space>
        <Input value={test.count} readOnly disabled />
      </Space>
    </Card>
  )
}

export default TestCount
