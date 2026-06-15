import { useState } from 'react'

/**
 * 1-5 star rating with half-star support.
 * Click left half of a star -> .5, right half -> full
 *
 * Props:
 * value: number (0..5, in 0.5 increments)
 * onChange?: (value: number) => void   omit for read-only
 * size?: 'normal' | 'large'
 * allowClear?: boolean    show "clear" button when value > 0 and onChange present
 */
export default function StarRating({
  value = 0,
  onChange,
  size = 'normal',
  allowClear = true,
}) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'
  const display = hover || value

  function classFor(i) {
    // i is 1..5
    if (display >= i) return 'star filled'
    if (display >= i - 0.5) return 'star half'
    return 'star'
  }

  function handleClick(e, i, isLeftHalf) {
    // Evita comportamentos inesperados de propagação dentro de tags <form>
    e.preventDefault()
    e.stopPropagation()
    
    if (!interactive) return
    const newVal = isLeftHalf ? i - 0.5 : i
    // Se clicar no mesmo valor atual, redefine para 0
    onChange(newVal === value ? 0 : newVal)
  }

  function handleMove(i, isLeftHalf) {
    if (!interactive) return
    setHover(isLeftHalf ? i - 0.5 : i)
  }

  return (
    <span
      className={
        'stars ' +
        (size === 'large' ? 'stars-large ' : '') +
        (interactive ? 'interactive' : '')
      }
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      onMouseLeave={() => setHover(0)}
      role={interactive ? 'slider' : 'img'}
      aria-label={`Rating ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span 
          key={i} 
          className={classFor(i)}
          style={{ 
            position: 'relative', // 🔍 CRUCIAL: Mantém as metades absolutas restritas a esta estrela
            display: 'inline-block',
            userSelect: 'none'
          }}
        >
          {/* Caractere visual padrão caso o CSS global falhe em renderizar o ícone */}
          {display >= i ? '★' : display >= i - 0.5 ? '🌓' : '☆'}

          {interactive && (
            <>
              {/* Metade Esquerda (.5) */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '50%',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
                onMouseMove={() => handleMove(i, true)}
                onClick={(e) => handleClick(e, i, true)}
              />
              {/* Metade Direita (Inteiro) */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  bottom: 0,
                  width: '50%',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
                onMouseMove={() => handleMove(i, false)}
                onClick={(e) => handleClick(e, i, false)}
              />
            </>
          )}
        </span>
      ))}
      
      {interactive && allowClear && value > 0 && (
        <button
          type="button" // Garante que o botão limpar não submeta o formulário
          className="rating-clear"
          style={{
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ff4d4f'
          }}
          onClick={(e) => {
            e.preventDefault()
            onChange(0)
          }}
          title="Clear rating"
        >
          ✕
        </button>
      )}
    </span>
  )
}