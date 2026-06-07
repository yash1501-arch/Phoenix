export const scrollToSection = (sectionId) => {
  // For internal page navigation (within the same page)
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};

export const navigateAndScroll = (navigate, path, sectionId) => {
  // Navigate to path and then scroll to section
  navigate(path);
  // Wait a bit for the navigation to complete, then scroll
  setTimeout(() => {
    scrollToSection(sectionId);
  }, 100);
};