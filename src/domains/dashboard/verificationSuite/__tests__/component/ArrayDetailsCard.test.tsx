import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ArrayDetailsCard from '../../components/ArrayDetailsCard';

describe('ArrayDetailsCard Component', () => {
  it('renders director details for director_verify_cin', () => {
    const data = {
      response: [
        {
          response: {
            data: [
              {
                firstName: 'John',
                lastName: 'Doe',
                fatherFirstName: 'Richard',
                DOB: '1990-01-01',
                companyName: 'Acme Corp',
                CIN: 'U12345MH2020PTC000001',
                DINStatus: 'Active',
              },
            ],
          },
        },
      ],
    };

    render(<ArrayDetailsCard data={data} serviceKey="director_verify_cin" />);

    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders gst return details from EFiledlist for gst_return_check', () => {
    const data = {
      EFiledlist: [
        {
          valid: 'Yes',
          mof: 'Online',
          dof: '2024-01-01',
          rtntype: 'GSTR-1',
          status: 'Filed',
        },
      ],
    };

    render(<ArrayDetailsCard data={data} serviceKey="gst_return_check" />);

    expect(screen.getByText('Method of Filing')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows N/A for null-like or masked values', () => {
    const data = {
      response: [
        {
          response: {
            data: [
              {
                firstName: '****',
                lastName: 'null',
                fatherFirstName: null,
              },
            ],
          },
        },
      ],
    };

    render(<ArrayDetailsCard data={data} serviceKey="director_verify_cin" />);

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('renders nothing when there is no array data for the service', () => {
    const data = { EFiledlist: [] };

    const { container } = render(
      <ArrayDetailsCard data={data} serviceKey="gst_return_check" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
