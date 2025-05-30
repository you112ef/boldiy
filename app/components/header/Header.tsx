import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center p-2 sm:p-3 md:p-5 border-b h-[var(--header-height)]', { // Responsive padding
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-1 sm:gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer"> {/* Responsive gap */}
        <div className="i-ph:sidebar-simple-duotone text-lg sm:text-xl" /> {/* Responsive icon size */}
        <a href="/" className="text-xl sm:text-2xl font-semibold text-accent flex items-center"> {/* Responsive font size */}
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[70px] sm:w-[90px] inline-block dark:hidden" /> {/* Responsive logo size */}
          <img src="/logo-dark-styled.png" alt="logo" className="w-[70px] sm:w-[90px] inline-block hidden dark:block" /> {/* Responsive logo size */}
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-2 sm:px-4 truncate text-center text-bolt-elements-textPrimary"> {/* Responsive padding */}
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="ltr:mr-1 rtl:ml-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
