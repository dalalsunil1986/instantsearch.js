import React from 'react';
import Breadcrumb from '../Breadcrumb';
import { mount } from 'enzyme';

describe('Breadcrumb', () => {
  it('should render <Breadcrumb />', () => {
    const props = {
      createURL: data => {
        JSON.stringify(data);
      },
      refine: () => {},
      items: [],
      cssClasses: {
        root: 'root',
        noRefinementRoot: 'noRefinementRoot',
        list: 'list',
        item: 'item',
        selectedItem: 'selectedItem',
        link: 'link',
        separator: 'separator',
      },
      templateProps: {
        templates: {
          home: 'home',
          separator: ' > ',
          link: 'link',
        },
      },
    };
    const wrapper = mount(<Breadcrumb {...props} />);

    expect(wrapper.find('.noRefinementRoot')).toHaveLength(1);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render <Breadcrumb /> with a single item', () => {
    const props = {
      createURL: data => {
        JSON.stringify(data);
      },
      refine: () => {},
      items: [
        {
          value: 'val0',
          label: 'label0',
        },
      ],
      cssClasses: {
        root: 'root',
        noRefinementRoot: 'noRefinementRoot',
        list: 'list',
        item: 'item',
        selectedItem: 'selectedItem',
        link: 'link',
        separator: 'separator',
      },
      templateProps: {
        templates: {
          home: 'home',
          separator: ' > ',
          link: 'link',
        },
      },
    };
    const wrapper = mount(<Breadcrumb {...props} />);

    expect(wrapper.find('.noRefinementRoot')).toHaveLength(0);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render <Breadcrumb /> with multiple items', () => {
    const props = {
      createURL: data => {
        JSON.stringify(data);
      },
      refine: () => {},
      items: [
        {
          value: 'val0',
          label: 'label0',
        },
        {
          value: 'val1',
          label: 'label1',
        },
      ],
      cssClasses: {
        root: 'root',
        noRefinementRoot: 'noRefinementRoot',
        list: 'list',
        item: 'item',
        selectedItem: 'selectedItem',
        link: 'link',
        separator: 'separator',
      },
      templateProps: {
        templates: {
          home: 'home',
          separator: ' > ',
          link: 'link',
        },
      },
    };
    const wrapper = mount(<Breadcrumb {...props} />);

    expect(wrapper.find('.noRefinementRoot')).toHaveLength(0);
    expect(wrapper).toMatchSnapshot();
  });
});
