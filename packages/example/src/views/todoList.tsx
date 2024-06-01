import './todoList.scss'

export function TodoList() {
  return (
    <div className="todo-list">
      <h1>TodoList</h1>
      {/*<div>*/}
      {/*  <input value={text} onInput={(e) => setText((e.target as HTMLInputElement).value)} />*/}
      {/*  <button onClick={add}>Add</button>*/}
      {/*</div>*/}
      {/*<ul>*/}
      {/*  {filterList.map((item) => (*/}
      {/*    <li key={item.content}>*/}
      {/*      <input*/}
      {/*        type="checkbox"*/}
      {/*        checked={item.complete}*/}
      {/*        onChange={(e) => dispatch(setComplete(item, (e.target as HTMLInputElement).checked))}*/}
      {/*      />*/}
      {/*      <span>{item.content}</span>*/}
      {/*    </li>*/}
      {/*  ))}*/}
      {/*</ul>*/}
      {/*<div>*/}
      {/*  <button*/}
      {/*    onClick={() =>*/}
      {/*      dispatch({*/}
      {/*        type: 'todoList/filter',*/}
      {/*        payload: 'all',*/}
      {/*      })*/}
      {/*    }*/}
      {/*  >*/}
      {/*    All*/}
      {/*  </button>*/}
      {/*  <button*/}
      {/*    onClick={() =>*/}
      {/*      dispatch({*/}
      {/*        type: 'todoList/filter',*/}
      {/*        payload: 'incomplete',*/}
      {/*      })*/}
      {/*    }*/}
      {/*  >*/}
      {/*    Incomplete*/}
      {/*  </button>*/}
      {/*  <button*/}
      {/*    onClick={() =>*/}
      {/*      dispatch({*/}
      {/*        type: 'todoList/filter',*/}
      {/*        payload: 'completed',*/}
      {/*      })*/}
      {/*    }*/}
      {/*  >*/}
      {/*    Completed*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  )
}
