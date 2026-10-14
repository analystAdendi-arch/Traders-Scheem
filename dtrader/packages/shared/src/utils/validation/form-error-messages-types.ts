type TMessage = () => string;
type TParameter = string | number;

export type TFormErrorMessagesTypes = Record<
    | 'empty_address'
    | 'empty_barrier'
    | 'address'
    | 'barrier'
    | 'email'
    | 'general'
    | 'name'
    | 'password'
    | 'po_box'
    | 'phone'
    | 'postcode'
    | 'signup_token'
    | 'tax_id'
    | 'number'
    | 'validTaxID',
    TMessage
> & {
    decimalPlaces: (decimals: TParameter) => string;
    value: (value: TParameter) => string;
    betweenMinMax: (min_value: TParameter, max_value: TParameter) => string;
    minNumber: (min_value: TParameter) => string;
    maxNumber: (max_value: TParameter) => string;
};
