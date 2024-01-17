import {VariantSelector} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';

export default function VariantProductOptions({product}) {
  return (
    <div className="grid gap-4 mb-6">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={product.variants}
      >
        {({option}) => {
          return (
            <div
              key={option.name}
              className="flex flex-col flex-wrap mb-4 gap-y-2 last:mb-0"
            >
              <h3 className="whitespace-pre-wrap max-w-prose font-bold text-lead min-w-[4rem]">
                {option.name}
              </h3>
              <div className="flex flex-wrap items-baseline gap-4">
                {option.values.map(({value, isAvailable, to, isActive}) => (
                  <Link
                    key={value}
                    to={to}
                    prefetch="intent"
                    className={`leading-none py-1 border-b-[1.5px] hover:no-underline cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'border-gray-500'
                        : isAvailable
                        ? 'border-neutral-50'
                        : 'opacity-80'
                    }`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
          );
        }}
      </VariantSelector>
    </div>
  );
}
