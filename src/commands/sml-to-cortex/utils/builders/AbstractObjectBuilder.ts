import { CloneUtil, ICloneOptions, IIndexer } from "../clone";

type SelfConstructor<IData, IObjectBuilder> = new (data: IData, cloneOptions: Partial<ICloneOptions>) => IObjectBuilder;

export type DataMutationFunc<IData> = (data: IData) => IData;

export abstract class AbstractObjectBuilder<
  IData extends IIndexer,
  IObjectBuilder extends AbstractObjectBuilder<IData, IObjectBuilder>,
> {
  protected constructor(
    private readonly data: IData,
    protected readonly cloneOptions: Partial<ICloneOptions> = {}
  ) {}

  protected get clonedData(): IData {
    return CloneUtil.deep(this.data, this.cloneOptions);
  }

  public with(data: Partial<IData>): IObjectBuilder {
    const newValues = Object.assign(this.clonedData, data);
    const ctor = Object.getPrototypeOf(this).constructor as SelfConstructor<IData, IObjectBuilder>;

    return new ctor(newValues, this.cloneOptions);
  }

  public mutate(mutationFunc: DataMutationFunc<IData>): IObjectBuilder {
    const newData = mutationFunc(this.clonedData);

    return this.with(newData);
  }

  public build(): IData {
    return this.clonedData;
  }
}
