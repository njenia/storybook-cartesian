declare type CartesianData<T> = {
    [P in keyof T]: Array<T[P]> | any;
};
declare const choice: (...choices: any) => any[];
declare const describedValue: (description: string, value: any) => any[];
declare const cartesian: (stories: any) => {
    add: <Props>(seed: () => CartesianData<Props>, renderTitle: (props: object) => string, renderStory: (props: object) => any, valid?: (props: Props) => boolean, apply?: (stories: any, candidate: {
        props: Props;
        story: any;
        title: string;
    }[]) => void) => void;
};
export { choice, describedValue };
export default cartesian;
