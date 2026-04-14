import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

type FieldLabelProps = {
  htmlFor: string
  label: string
}

export function FieldLabel({ htmlFor, label }: FieldLabelProps) {
  return (
    <label className="ui-field-label" htmlFor={htmlFor}>
      {label}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ui-input" {...props} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ui-select" {...props} />
}
