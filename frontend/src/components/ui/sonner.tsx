import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#111111] group-[.toaster]:text-[#CCCCCC] group-[.toaster]:border-[#1A1A1A] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-[2px] font-sans",
          description: "group-[.toast]:text-[#8F8F8F] group-[.toast]:text-[12px]",
          actionButton: "group-[.toast]:bg-[#DA291C] group-[.toast]:text-white group-[.toast]:rounded-[2px] group-[.toast]:text-[11px] group-[.toast]:uppercase group-[.toast]:tracking-[1px] group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-[#1A1A1A] group-[.toast]:text-[#8F8F8F] group-[.toast]:rounded-[2px] group-[.toast]:text-[11px] group-[.toast]:uppercase group-[.toast]:tracking-[1px]",
          closeButton: "group-[.toast]:bg-[#0A0A0A] group-[.toast]:text-[#555555] group-[.toast]:border-[#1A1A1A] hover:group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
