import { createStore } from 'rabbitx'

export const useTestStore = createStore({
  name: 'test',
  state: () => {
    return {
      count: 0,
      wo: 1,
    }
  },
  actions: () => {
    return {
      add({ state }, num: number = 1) {
        state.count += num
      },
      ranAdd(ctx) {
        const num = Math.floor(Math.random() * 10)
        this.add(ctx, num)
      },
      ranWo({ state }) {
        state.wo = Math.random()
      },
      waitTime({ state }, time = 1000) {
        return new Promise((resolve) => {
          setTimeout(() => {
            state.wo = Math.random()
            resolve(state.wo)
          }, time)
        })
      },
    }
  },
})
