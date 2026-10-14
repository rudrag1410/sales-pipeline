import { useId, useState } from 'react';
import ReactSelect from 'react-select';

import styles from './Select.module.css';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string = string> {
  options: ReadonlyArray<SelectOption<V>>;
  value: V | null;
  onChange: (value: V) => void;
  label?: string;

  'aria-label'?: string;
  placeholder?: string;
  isDisabled?: boolean;

  isSearchable?: boolean;

  focusOnMount?: boolean;
  id?: string;
}

const SEARCHABLE_THRESHOLD = 8;
const MENU_Z_INDEX = 80;

const css = (name: string): string => styles[name] ?? '';

const cls = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ');

export const Select = <V extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  isDisabled = false,
  isSearchable,
  focusOnMount,
  id,
  'aria-label': ariaLabel,
}: SelectProps<V>) => {
  const generatedId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const inputId = id ?? generatedId;
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className={styles.field}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <ReactSelect<SelectOption<V>>
        unstyled
        inputId={inputId}
        aria-label={label ? undefined : ariaLabel}
        options={options}
        value={selected}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isSearchable={isSearchable ?? options.length > SEARCHABLE_THRESHOLD}
        isClearable={false}

        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={focusOnMount}
        isOptionDisabled={(option) => option.disabled === true}
        menuPortalTarget={document.body}
        menuPosition="fixed"

        styles={{
          menuPortal: (base) => ({ ...base, zIndex: MENU_Z_INDEX }),
          control: (base) => ({
            ...base,
            minHeight: 'var(--control-height)',
            height: 'var(--control-height)',
          }),
        }}
        onMenuOpen={() => {
          setMenuOpen(true);
        }}
        onMenuClose={() => {
          setMenuOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuOpen) event.stopPropagation();
        }}
        onChange={(option) => {
          if (option) onChange(option.value);
        }}
        classNames={{
          control: ({ isFocused, isDisabled: disabled }) =>
            cls(
              styles.control,
              isFocused && styles.controlFocused,
              disabled && styles.controlDisabled,
            ),
          valueContainer: () => css('valueContainer'),
          singleValue: () => css('singleValue'),
          placeholder: () => css('placeholder'),
          dropdownIndicator: () => css('indicator'),
          menu: () => css('menu'),
          option: ({ isFocused, isSelected, isDisabled: disabled }) =>
            cls(
              styles.option,
              isFocused && styles.optionFocused,
              isSelected && styles.optionSelected,
              disabled && styles.optionDisabled,
            ),
          noOptionsMessage: () => css('noOptions'),
        }}
        components={{ IndicatorSeparator: null }}
      />
    </div>
  );
};
