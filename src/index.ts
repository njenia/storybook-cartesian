import {
  concat,
  each,
  filter,
  find,
  first,
  flatMap,
  fromPairs,
  get,
  isArray,
  isEmpty,
  keys,
  map,
  mapValues,
  reduce,
  values,
  reject,
  zip
} from 'lodash/fp'

import flatten, { unflatten } from 'flat'

type CartesianData<T> = { [P in keyof T]: Array<T[P]> | any }

const xproduct = (vals: any[][]) =>
  reduce((a: any[][], b: any[]) => flatMap(x => map(y => concat(x, [y]))(b))(a))([
    []
  ])(vals)

/*
Turns seed data into node enriched data:
  { foo: ['one', 'two']}
becomes
  { foo: ['$choice$', ['one', 'two']]}
but if compiled data is input:
  { foo: choice('one','two') } -> { foo: ['$choice$', ['one', 'two']]}
it will return it as-is.
*/
const compile = <Props>(data: CartesianData<Props>) =>
  find(v => isChoice(v), values(data))
    ? data
    : mapValues(v => (isArray(v) ? choice(...v) : v), data)

const isChoice = (v: any) =>
  isArray(v) && v.length === 2 && first(v) === '$choice$'
const choice = (...choices: any) => ['$choice$', choices]
const nodeValue = (node: any) => get('1', node)

const describedValue = (description: string, value: any) => ['$describedValue$', description, value]
const isDescribedValue = (v: any) => isArray(v) && first(v) === '$describedValue$'
const describedValueDescription = (v: Array<any>) => v[1]
const describedValueValue = (v: Array<any>) => v[2]

/*
Seed data structure:

Use AST-like nodes to indicate choice fields, with which to
do cartesian operations.

input:
{
  prop1: ['$choice$', [1,2,3]]  // will be used for cartesian data
  prop2: [1,2,3]                // left as-is
}
*/
const cartesian = (stories: any) => ({
  add: <Props>(
    seed: () => CartesianData<Props>,
    renderTitle: (props: object) => string,
    renderStory: (props: object) => any,
    valid: (props: Props) => boolean = () => true,
    apply: (
      stories: any,
      candidate: Array<{ props: Props; story: any; title: string }>
    ) => void = (s, cands) =>
      each(cand => s.add(cand.title, () => cand.story), cands),
  ) => {
    const data = flatten(seed(), { safe: true })
    const compiledData = compile(data)
    const fields = keys(compiledData)
    const rows = map(
      p => unflatten(fromPairs(zip(fields, p))) as Props,
      xproduct(
        map(
          v => (isChoice(v) ? nodeValue(v) : [v]),
          values<CartesianData<Props>>(compiledData)
        )
      )
    )
    const candidates = map(
      props => ({
        props,
        story: renderStory(mapValues((v: any) => isDescribedValue(v) ? describedValueValue(v) : v, props)),
        title: renderTitle({
          ...mapValues((v: any) => isDescribedValue(v) ? describedValueValue(v) : v, props),
          __valueDescription: mapValues((v: any) => isDescribedValue(v) ? describedValueDescription(v) : null, props)
        })
      }),
      filter(valid, reject(isEmpty, rows))
    )

    apply(stories, candidates)
  }
})

export { choice, describedValue }
export default cartesian
