export function renderPagination(container, currentPage, totalPages, onPage, options = {}){
  if (typeof container === 'string') container = document.querySelector(container);
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1 && !options.showPageSize) return;

  const ul = document.createElement('ul');
  ul.className = 'pagination justify-content-center';

  const makeItem = (p, label = null, disabled=false, active=false) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label || String(p);
    a.addEventListener('click', (e)=>{e.preventDefault(); if(!disabled && !active && typeof onPage === 'function') onPage(p);});
    li.appendChild(a);
    return li;
  };

  ul.appendChild(makeItem(Math.max(1,currentPage-1), 'Prev', currentPage===1));

  // show a window of pages
  const windowSize = options.windowSize || 7;
  let start = Math.max(1, currentPage - Math.floor(windowSize/2));
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize -1) start = Math.max(1, end - windowSize +1);

  for(let p = start; p<=end; p++) ul.appendChild(makeItem(p, null, false, p===currentPage));

  ul.appendChild(makeItem(Math.min(totalPages,currentPage+1), 'Next', currentPage===totalPages));
  container.appendChild(ul);

  if (options.showPageSize){
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex justify-content-end mt-2';
    const sel = document.createElement('select');
    sel.className = 'form-select form-select-sm w-auto';
    const pageSizeOptions = options.pageSizeOptions || [25,50,100];
    pageSizeOptions.forEach(ps => { const o = document.createElement('option'); o.value = ps; o.textContent = `${ps}/trang`; if(ps===options.pageSize) o.selected=true; sel.appendChild(o); });
    sel.addEventListener('change', ()=>{ if (typeof options.onPageSizeChange === 'function') options.onPageSizeChange(Number(sel.value)); });
    wrapper.appendChild(sel);
    container.appendChild(wrapper);
  }
}
